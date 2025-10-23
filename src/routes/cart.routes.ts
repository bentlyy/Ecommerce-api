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
 *       200:
 *         description: Carrito del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: number, example: 12 }
 *                 userId: { type: number, example: 3 }
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: number, example: 5 }
 *                       productId: { type: number, example: 10 }
 *                       quantity: { type: number, example: 2 }
 *                       product:
 *                         type: object
 *                         properties:
 *                           id: { type: number, example: 10 }
 *                           title: { type: string, example: "iPhone 15" }
 *                           price: { type: number, example: 999.99 }
 *       401:
 *         description: No autenticado
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
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: number, example: 3 }
 *               quantity: { type: number, example: 2, minimum: 1 }
 *     responses:
 *       201:
 *         description: Producto añadido o actualizado
 *       400:
 *         description: Error de validación o stock insuficiente
 *       401:
 *         description: No autenticado
 */
router.post("/", validate(addToCartSchema), CartController.add);

/**
 * @swagger
 * /cart/{productId}:
 *   put:
 *     summary: Fijar cantidad exacta de un producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer, example: 3 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number, example: 5, minimum: 1 }
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado
 */
router.put("/:productId", validate(updateCartItemSchema), CartController.update);

/**
 * @swagger
 * /cart/{productId}/increment:
 *   patch:
 *     summary: Incrementar en +1 la cantidad del producto
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer, example: 3 }
 *     responses:
 *       200:
 *         description: Cantidad incrementada
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no está en el carrito
 */
router.patch("/:productId/increment", CartController.increment);

/**
 * @swagger
 * /cart/{productId}/decrement:
 *   patch:
 *     summary: Disminuir en -1 la cantidad del producto (si llega a 0 se elimina)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer, example: 3 }
 *     responses:
 *       200:
 *         description: Cantidad decrementada o producto eliminado si llegó a 0
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no está en el carrito
 */
router.patch("/:productId/decrement", CartController.decrement);

/**
 * @swagger
 * /cart/{productId}:
 *   delete:
 *     summary: Eliminar completamente el producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer, example: 3 }
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito
 *       401:
 *         description: No autenticado
 */
router.delete("/:productId", CartController.remove);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Vaciar el carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado
 *       401:
 *         description: No autenticado
 */
router.delete("/", CartController.clear);

export default router;
