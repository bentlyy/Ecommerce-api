import { Request } from "express";

/**
 * Stripe exige el RAW body para validar la firma (NO usar express.json en esta ruta).
 * Este helper setea el "body" crudo en req.rawBody para el controlador del webhook.
 */
export function rawBodyBuffer(req: Request, _: any, buf: Buffer) {
  // Solo si el content-type es json
  if (buf && buf.length) {
    // @ts-ignore - añadimos propiedad ad-hoc
    req.rawBody = buf.toString("utf8");
  }
}
