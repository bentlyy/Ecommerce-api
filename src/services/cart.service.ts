import { prisma } from "../config/prisma";
import { AddToCartDTO, UpdateCartItemDTO } from "../dtos/cart.dto";

export class CartService {
  async getCart(userId: number) {
    return prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async addItem(userId: number, data: AddToCartDTO) {
    const product = await prisma.product.findFirst({ where: { id: data.productId, active: true } });
    if (!product) throw new Error("Producto no encontrado o inactivo");
    if (product.stock < data.quantity) throw new Error("Stock insuficiente");

    const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId: data.productId } });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + data.quantity },
      });
    }

    return prisma.cartItem.create({ data: { cartId: cart.id, productId: data.productId, quantity: data.quantity } });
  }

  async updateItem(userId: number, productId: number, data: UpdateCartItemDTO) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error("Carrito no encontrado");

    return prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity: data.quantity },
    });
  }

  async incrementItem(userId: number, productId: number) {
    return this.addItem(userId, { productId, quantity: 1 });
  }

  async decrementItem(userId: number, productId: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error("Carrito no encontrado");

    const item = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (!item) throw new Error("Producto no está en el carrito");

    if (item.quantity === 1) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return { message: "Producto eliminado (cantidad llegó a 0)" };
    }

    return prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: item.quantity - 1 },
    });
  }

  async removeItem(userId: number, productId: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error("Carrito no encontrado");

    return prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  }

  async clearCart(userId: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return { message: "Carrito vacío" };

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: "Carrito vaciado" };
  }
}
