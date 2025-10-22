import { prisma } from "../config/prisma";
import { stripe } from "../config/stripe";
import { config } from "../config";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";

function toNumber(d: Prisma.Decimal | number) {
  return typeof d === "number" ? d : Number(d.toString());
}

// Stripe trata CLP como moneda de cero decimales
const ZERO_DECIMAL = new Set(["clp", "jpy", "krw", "vnd"]);

function amountForStripe(currency: string, amount: number) {
  return ZERO_DECIMAL.has(currency.toLowerCase())
    ? Math.round(amount) // pesos
    : Math.round(amount * 100);
}

export class PaymentsService {
  /**
   * Crea un Checkout Session de Stripe a partir del carrito del usuario.
   * - Crea una Order en estado REQUIRES_PAYMENT_METHOD
   * - NO descuenta stock todavía (se hará al confirmar pago)
   * - Devuelve la URL de Checkout de Stripe para redirigir
   */
  async createCheckoutSession(userId: number) {
    // Cargar carrito con productos
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      const err = new Error("CART_EMPTY");
      (err as any).status = 404;
      throw err;
    }

    // Validaciones previas
    for (const it of cart.items) {
      if (!it.product || !it.product.active) {
        const err = new Error("PRODUCT_INACTIVE_OR_NOT_FOUND");
        (err as any).status = 400;
        throw err;
      }
      if (it.product.stock <= 0) {
        const err = new Error(`OUT_OF_STOCK_${it.productId}`);
        (err as any).status = 400;
        throw err;
      }
    }

    // Moneda del e-commerce
    const currency = "clp";

    // Calcula total para guardar en Order (no necesario para Stripe, pero útil)
    const totalAmount = cart.items.reduce((acc, it) => {
      return acc + toNumber(it.product!.price) * it.quantity;
    }, 0);

    // Creamos la Order y sus items (PERO no tocamos stock ni carrito aún)
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: "REQUIRES_PAYMENT_METHOD",
          totalAmount,
          currency,
        },
      });

      await tx.orderItem.createMany({
        data: cart.items.map((it) => ({
          orderId: createdOrder.id,
          productId: it.productId,
          title: it.product!.title,
          price: it.product!.price,
          quantity: it.quantity,
        })),
      });

      return createdOrder;
    });

    // Construimos line_items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency,
          product_data: {
            name: it.product!.title,
            // Puedes agregar imagen si tienes URL
            ...(it.product!.imageUrl
              ? { images: [it.product!.imageUrl] }
              : {}),
            metadata: {
              productId: String(it.productId),
            },
          },
          unit_amount: amountForStripe(currency, toNumber(it.product!.price)),
        },
      }));

    const successUrl = `${config.frontendUrl}/checkout/success?orderId=${order.id}`;
    const cancelUrl = `${config.frontendUrl}/checkout/cancel?orderId=${order.id}`;

    // Creamos el Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Metadata útil para atar el evento al order
      metadata: {
        orderId: String(order.id),
        userId: String(userId),
      },
      customer_email: undefined, // si tienes email del user y quieres autoprellenar
      // Opcional: locale, billing, shipping, etc.
    });

    // Retornamos la URL para redirigir
    return {
      orderId: order.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Procesa el webhook de Stripe y actualiza la Order:
   * - checkout.session.completed: marcamos Order como PAID,
   *   guardamos payment_intent, descontamos stock y limpiamos carrito.
   * - payment_intent.payment_failed: marcamos como FAILED
   */
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = session.payment_intent as string | null;
        const orderId = session.metadata?.orderId;

        if (!orderId) break;

        // Cargamos la orden + items + usuario
        const order = await prisma.order.findUnique({
          where: { id: Number(orderId) },
          include: { items: true, user: true },
        });
        if (!order) break;

        // Si ya está pagada, no repetimos
        if (order.status === "PAID") break;

        // Transacción: marcar pagada, setear paymentIntent, descontar stock, limpiar carrito
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              stripePaymentIntentId: paymentIntentId ?? undefined,
            },
          });

          // Descontar stock por cada OrderItem
          for (const it of order.items) {
            await tx.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.quantity } },
            });
          }

          // Limpiar carrito del usuario
          await tx.cartItem.deleteMany({
            where: { cart: { userId: order.userId } },
          });
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = (pi.metadata as any)?.orderId;
        if (!orderId) break;

        await prisma.order.updateMany({
          where: { id: Number(orderId), status: { not: "PAID" } },
          data: { status: "FAILED" },
        });
        break;
      }

      default:
        // Otros eventos: log opcional
        // console.log(`Unhandled event type ${event.type}`);
        break;
    }
  }
}
