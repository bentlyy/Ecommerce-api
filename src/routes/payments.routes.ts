import { Router } from "express";
import { PaymentsController } from "../controllers/payments.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Checkout (Stripe) y Webhook
 */

/**
 * @swagger
 * /payments/checkout:
 *   post:
 *     summary: Crear Checkout Session (Stripe) y devolver URL de pago
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: URL de checkout creada
 *       404:
 *         description: Carrito vacío
 *       400:
 *         description: Error en la creación
 */
router.post("/checkout", authMiddleware, PaymentsController.createCheckoutSession);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Webhook de Stripe (no requiere auth)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Recibido correctamente
 *       400:
 *         description: Firma inválida / error
 */
router.post("/webhook", PaymentsController.webhook);

// ✅ Vistas temporales para éxito y cancelación (Flujo C)
router.get("/success", PaymentsController.successPage);
router.get("/cancel", PaymentsController.cancelPage);

export default router;
