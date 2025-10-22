import { prisma } from "../config/prisma";
import { AdminListOrdersQueryDTO, ListOrdersQueryDTO } from "../dtos/order.dto";
import { Prisma } from "@prisma/client";

// Utilidad para total (Decimal-safe)
function toNumber(d: Prisma.Decimal | number) {
  return typeof d === "number" ? d : Number(d.toString());
}

export class OrdersService {
  /**
   * Crea una Order desde el carrito del usuario:
   * - 404 si no hay carrito o no tiene items.
   * - Valida stock y productos activos.
   * - Descuenta stock.
   * - Crea order + orderItems.
   * - Vacía carrito.
   */
  async checkout(userId: number) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      const err = new Error("CART_EMPTY");
      (err as any).status = 404;
      throw err;
    }

    // Validaciones de negocio previas
    for (const it of cart.items) {
      if (!it.product || !it.product.active) {
        const err = new Error("PRODUCT_INACTIVE_OR_NOT_FOUND");
        (err as any).status = 400;
        throw err;
      }
      if (it.product.stock < it.quantity) {
        const err = new Error(`INSUFFICIENT_STOCK_${it.productId}`);
        (err as any).status = 400;
        throw err;
      }
    }

    // Calcula total (moneda única por simplicidad)
    const currency = "usd";
    const totalAmount = cart.items.reduce((acc, it) => {
      return acc + toNumber(it.product!.price) * it.quantity;
    }, 0);

    // Transacción: crea order, items; descuenta stock; limpia carrito
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          totalAmount,
          currency,
        },
      });

      // Crea order items
      await tx.orderItem.createMany({
        data: cart.items.map((it) => ({
          orderId: createdOrder.id,
          productId: it.productId,
          title: it.product!.title,
          price: it.product!.price, // Decimal preservado por Prisma
          quantity: it.quantity,
        })),
      });

      // Descuenta stock
      for (const it of cart.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      // Limpia carrito
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    // Devuelve order con items
    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return full;
  }

  async listByUser(userId: number, query: ListOrdersQueryDTO) {
    const { page, limit, status } = query;

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }

  async getByIdForUser(userId: number, orderId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) {
      const err = new Error("ORDER_NOT_FOUND");
      (err as any).status = 404;
      throw err;
    }
    return order;
  }

  // ===== ADMIN =====

  async adminListAll(query: AdminListOrdersQueryDTO) {
    const { page, limit, status, userId } = query;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(userId ? { userId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true, user: true },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }

  async adminGetById(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) {
      const err = new Error("ORDER_NOT_FOUND");
      (err as any).status = 404;
      throw err;
    }
    return order;
  }
}
