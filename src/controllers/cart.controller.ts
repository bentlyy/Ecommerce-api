import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const cartService = new CartService();

export class CartController {
  static async get(req: AuthRequest, res: Response) {
    try {
      const cart = await cartService.getCart(req.user!.userId);
      res.json(cart ?? { items: [] });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  static async add(req: AuthRequest, res: Response) {
    try {
      const item = await cartService.addItem(req.user!.userId, req.body);
      res.status(201).json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const productId = Number(req.params.productId);
      const item = await cartService.updateItem(req.user!.userId, productId, req.body);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      const productId = Number(req.params.productId);
      await cartService.removeItem(req.user!.userId, productId);
      res.json({ message: "Producto eliminado del carrito" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  static async clear(req: AuthRequest, res: Response) {
    try {
      const result = await cartService.clearCart(req.user!.userId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
