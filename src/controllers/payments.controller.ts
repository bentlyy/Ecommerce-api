import { Response, Request } from "express";
import { PaymentsService } from "../services/payments.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { stripe } from "../config/stripe";
import { config } from "../config";

const service = new PaymentsService();

export class PaymentsController {
  /**
   * Crea sesión de pago y devuelve URL Stripe
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
   * Webhook Stripe — verifica firma y procesa orden
   */
  static async webhook(req: Request, res: Response) {
    try {
      // @ts-ignore (leído por rawBody middleware)
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
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  /**
   * Página temporal de éxito
   */
  static async successPage(_req: Request, res: Response) {
    res.send(
      `<h1>✅ Pago completado</h1><p>Gracias por tu compra. Tu orden está pagada.</p>`
    );
  }

  /**
   * Página temporal de cancelación
   */
  static async cancelPage(_req: Request, res: Response) {
    res.send(
      `<h1>❌ Pago cancelado</h1><p>No se ha realizado el cobro.</p>`
    );
  }
}
