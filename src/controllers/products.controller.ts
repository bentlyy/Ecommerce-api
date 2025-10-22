import { Request, Response } from "express";
import { ProductsService } from "../services/products.service";

const service = new ProductsService();

export class ProductsController {
  static async create(req: Request, res: Response) {
    try {
      const product = await service.create(req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
      const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
      const sort = req.query.sort as "price.asc" | "price.desc" | "newest" | undefined;

      const data = await service.list({
        page, limit, search, category, minPrice, maxPrice, sort,
      });

      res.json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const product = await service.getById(id);
      res.json(product);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const product = await service.update(id, req.body);
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await service.softDelete(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}
