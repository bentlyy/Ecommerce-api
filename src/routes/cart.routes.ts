/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Gestión del carrito de compras (requiere login)
 */

import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../dtos/cart.dto";

const router = Router();

// Todas las rutas requieren JWT
router.use(authMiddleware);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Obtener el carrito del usuario autenticado
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Carrito encontrado }
 *       401: { description: No autenticado }
 */
router.get("/", CartController.get);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Agregar producto al carrito (si existe, suma cantidad)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: number, example: 3 }
 *               quantity: { type: number, example: 2 }
 *     responses:
 *       201: { description: Producto añadido o actualizado }
 *       400: { description: Error de validación }
 *       401: { description: No autenticado }
 */
router.post("/", validate(addToCartSchema), CartController.add);

/**
 * @swagger
 * /cart/{productId}:
 *   put:
 *     summary: Actualizar cantidad de un producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: number, example: 3 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: number, example: 5 }
 *     responses:
 *       200: { description: Cantidad actualizada }
 *       401: { description: No autenticado }
 */
router.put("/:productId", validate(updateCartItemSchema), CartController.update);

/**
 * @swagger
 * /cart/{productId}:
 *   delete:
 *     summary: Eliminar un producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: number, example: 3 }
 *     responses:
 *       200: { description: Producto eliminado del carrito }
 *       401: { description: No autenticado }
 */
router.delete("/:productId", CartController.remove);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Vaciar completamente el carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Carrito vaciado }
 *       401: { description: No autenticado }
 */
router.delete("/", CartController.clear);

export default router;
