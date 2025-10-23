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
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: number, example: 1 }
 *         title: { type: string, example: "iPhone 15" }
 *         description: { type: string, example: "Smartphone 2024" }
 *         price: { type: number, example: 999.99 }
 *         currency: { type: string, example: "usd" }
 *         stock: { type: number, example: 10 }
 *         imageUrl: { type: string, example: "https://example.com/iphone.jpg" }
 *         active: { type: boolean, example: true }
 *         category:
 *           type: object
 *           properties:
 *             id: { type: number, example: 2 }
 *             name: { type: string, example: "Celulares" }
 *
 *     ProductList:
 *       type: object
 *       properties:
 *         page: { type: number, example: 1 }
 *         limit: { type: number, example: 10 }
 *         total: { type: number, example: 42 }
 *         pages: { type: number, example: 5 }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *
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
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear producto (ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201: { description: Producto creado }
 *       400: { description: Datos inválidos }
 *       403: { description: Requiere rol ADMIN }
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
 * /products:
 *   get:
 *     summary: Listar productos (público)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductList'
 */
router.get("/", ProductsController.list);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Producto encontrado }
 *       404: { description: No encontrado }
 */
router.get("/:id", ProductsController.getById);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar producto (ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200: { description: Producto actualizado }
 *       400: { description: Datos inválidos }
 *       401: { description: No autenticado }
 *       403: { description: Requiere rol ADMIN }
 *       404: { description: Producto no encontrado }
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
 * /products/{id}:
 *   delete:
 *     summary: Desactivar producto (soft delete) - ADMIN
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Producto desactivado correctamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Requiere rol ADMIN
 *       404:
 *         description: Producto no encontrado
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  ProductsController.remove
);

export default router;
