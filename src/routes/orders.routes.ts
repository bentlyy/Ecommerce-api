import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/role.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Checkout y gestión de órdenes
 */

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: "Crear orden desde el carrito del usuario"
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Orden creada
 *       404:
 *         description: Carrito vacío
 *       400:
 *         description: Error de validación o stock
 */
router.post("/checkout", authMiddleware, OrdersController.checkout);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: "Listar mis órdenes"
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, REQUIRES_PAYMENT_METHOD, REQUIRES_CONFIRMATION, CANCELED, PAID, FAILED]
 *     responses:
 *       200:
 *         description: Paginación de órdenes del usuario
 */
router.get("/", authMiddleware, OrdersController.listMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: "Ver detalle de una de mis órdenes"
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Orden
 *       404:
 *         description: No encontrada
 */
router.get("/:id", authMiddleware, OrdersController.getMyOrder);

/**
 * @swagger
 * /api/orders/admin:
 *   get:
 *     summary: "[ADMIN] Listar todas las órdenes (opcional filtrar por usuario y status)"
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: userId
 *         schema: { type: integer, example: 5 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, REQUIRES_PAYMENT_METHOD, REQUIRES_CONFIRMATION, CANCELED, PAID, FAILED]
 *     responses:
 *       200:
 *         description: Paginación de órdenes
 *       403:
 *         description: Requiere rol ADMIN
 */
router.get("/admin", authMiddleware, isAdmin, OrdersController.adminList);

/**
 * @swagger
 * /api/orders/admin/{id}:
 *   get:
 *     summary: "[ADMIN] Detalle de una orden por ID"
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Orden
 *       404:
 *         description: No encontrada
 *       403:
 *         description: Requiere rol ADMIN
 */
router.get("/admin/:id", authMiddleware, isAdmin, OrdersController.adminGetById);

export default router;
