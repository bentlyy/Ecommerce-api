import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export type JWTPayload = {
  userId: number;
  role: "ADMIN" | "CUSTOMER";
  iat?: number;
  exp?: number;
};

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }
  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
