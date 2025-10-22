import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export function requireRoles(...roles: Array<"ADMIN" | "CUSTOMER">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "No tienes permisos" });
    }
    next();
  };
}

/**
 * Middleware específico para ADMIN
 */
export const isAdmin = requireRoles("ADMIN");

/**
 * Middleware opcional para CUSTOMER (puede servir más adelante)
 */
export const isCustomer = requireRoles("CUSTOMER");