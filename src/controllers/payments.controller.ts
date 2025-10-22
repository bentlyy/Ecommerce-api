import { Response, Request } from "express";
import { PaymentsService } from "../services/payments.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { stripe } from "../config/stripe";
import { config } from "../config";

const service = new PaymentsService();

export class PaymentsController {
  /**
   * Crea una sesión de Checkout y devuelve la URL para redirigir al usuario.
   */
  static async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      const data = await service.createCheckoutSession(req.user!.userId);
      res.status(201).json(data);
    } catch (e: any) {
      const code = e?.status ?? (e?.message === "CART_EMPTY" ? 404 : 400);
      res.status(code).json({ message: e.message ?? "Error al crear checkout" });
    }
  }

  /**
   * Webhook de Stripe (raw body + firma)
   */
  static async webhook(req: Request, res: Response) {
    try {
      // @ts-ignore - leemos rawBody que setea el bodyParser del app para esta ruta
      const sig = req.headers["stripe-signature"] as string;
      // @ts-ignore
      const rawBody = req.rawBody as string;

      const event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        config.stripeWebhookSecret
      );

      await service.handleWebhookEvent(event);

      res.json({ received: true });
    } catch (err: any) {
      // Firma inválida o error de parseo
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
