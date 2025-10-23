import { prisma } from "../config/prisma";
import { stripe } from "../config/stripe";
import { config } from "../config";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";

function toNumber(d: Prisma.Decimal | number) {
  return typeof d === "number" ? d : Number(d.toString());
}

const ZERO_DECIMAL = new Set(["clp", "jpy", "krw", "vnd"]);

function amountForStripe(currency: string, amount: number) {
  return ZERO_DECIMAL.has(currency.toLowerCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

export class PaymentsService {
  /**
   * Flujo A:
   * - Crear orden en estado REQUIRES_PAYMENT_METHOD
   * - Crear Checkout Session de Stripe
   * - NO descuenta stock aún (solo cuando el webhook confirme el pago)
   */
  async createCheckoutSession(userId: number) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      const err = new Error("CART_EMPTY");
      (err as any).status = 404;
      throw err;
    }

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

    const currency = "clp";
    const totalAmount = cart.items.reduce(
      (acc, it) => acc + toNumber(it.product!.price) * it.quantity,
      0
    );

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

    const baseUrl = config.baseUrl; // <-- Railway BASE_URL
    const successUrl = `${baseUrl}/payments/success?orderId=${order.id}`;
    const cancelUrl = `${baseUrl}/payments/cancel?orderId=${order.id}`;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency,
          product_data: {
            name: it.product!.title,
            ...(it.product!.imageUrl ? { images: [it.product!.imageUrl] } : {}),
            metadata: { productId: String(it.productId) },
          },
          unit_amount: amountForStripe(currency, toNumber(it.product!.price)),
        },
      }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId: String(order.id), userId: String(userId) },
    });

    return {
      orderId: order.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Webhook Stripe -> Confirmar pago real
   */
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = session.payment_intent as string | null;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const order = await prisma.order.findUnique({
          where: { id: Number(orderId) },
          include: { items: true, user: true },
        });
        if (!order || order.status === "PAID") break;

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              stripePaymentIntentId: paymentIntentId ?? undefined,
            },
          });

          for (const it of order.items) {
            await tx.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.quantity } },
            });
          }

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
    }
  }
}
