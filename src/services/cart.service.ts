import { prisma } from "../config/prisma";
import { AddToCartDTO, UpdateCartItemDTO } from "../dtos/cart.dto";

export class CartService {
  async getCart(userId: number) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  async addItem(userId: number, data: AddToCartDTO) {
    const product = await prisma.product.findFirst({
      where: { id: data.productId, active: true },
    });

    if (!product) throw new Error("Producto no encontrado o inactivo");
    if (product.stock < data.quantity) throw new Error("Stock insuficiente");

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: data.productId },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
      },
    });
  }

  async updateItem(userId: number, productId: number, data: UpdateCartItemDTO) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error("Carrito no encontrado");

    return prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity: data.quantity },
    });
  }

  async removeItem(userId: number, productId: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error("Carrito no encontrado");

    return prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
  }

  async clearCart(userId: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return { message: "Carrito vacío" };

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: "Carrito vaciado" };
  }
}
