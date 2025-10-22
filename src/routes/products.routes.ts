/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Gestión de productos
 */

import { Router } from "express";
import { ProductsController } from "../controllers/products.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createProductSchema, updateProductSchema } from "../dtos/product.dto";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductInput:
 *       type: object
 *       properties:
 *         title: { type: string, example: "iPhone 15" }
 *         description: { type: string, example: "Smartphone 2024" }
 *         price: { type: number, example: 999.99 }
 *         currency: { type: string, example: "usd" }
 *         stock: { type: number, example: 10 }
 *         imageUrl: { type: string, example: "https://example.com/iphone.jpg" }
 *         categoryId: { type: number, example: 1 }
 *         categoryName: { type: string, example: "Celulares" }
 *
 *     ProductUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/ProductInput'
 *       properties:
 *         active:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear producto (ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authMiddleware,
  requireRoles("ADMIN"),
  validate(createProductSchema),
  ProductsController.create
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar productos (público)
 *     tags: [Products]
 */
router.get("/", ProductsController.list);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por id
 *     tags: [Products]
 */
router.get("/:id", ProductsController.getById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto (ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  validate(updateProductSchema),
  ProductsController.update
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Desactivar producto (soft delete) - ADMIN
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  ProductsController.remove
);

export default router;
