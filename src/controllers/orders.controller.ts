import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { OrdersService } from "../services/orders.service";
import { listOrdersQuerySchema, adminListOrdersQuerySchema } from "../dtos/order.dto";

const service = new OrdersService();

export class OrdersController {
  // Usuario: crear orden desde carrito
  static async checkout(req: AuthRequest, res: Response) {
    try {
      const order = await service.checkout(req.user!.userId);
      res.status(201).json(order);
    } catch (e: any) {
      const code = e?.status ?? (e?.message === "CART_EMPTY" ? 404 : 400);
      res.status(code).json({ message: e.message ?? "Error en checkout" });
    }
  }

  // Usuario: listar mis órdenes
  static async listMyOrders(req: AuthRequest, res: Response) {
    try {
      const query = listOrdersQuerySchema.parse(req.query);
      const data = await service.listByUser(req.user!.userId, query);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // Usuario: ver detalle de una orden mía
  static async getMyOrder(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const order = await service.getByIdForUser(req.user!.userId, id);
      res.json(order);
    } catch (e: any) {
      const code = e?.status ?? 400;
      res.status(code).json({ message: e.message });
    }
  }

  // ===== ADMIN =====

  static async adminList(req: AuthRequest, res: Response) {
    try {
      const query = adminListOrdersQuerySchema.parse(req.query);
      const data = await service.adminListAll(query);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  static async adminGetById(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const order = await service.adminGetById(id);
      res.json(order);
    } catch (e: any) {
      const code = e?.status ?? 400;
      res.status(code).json({ message: e.message });
    }
  }
}
