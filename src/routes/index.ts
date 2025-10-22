import { Router } from "express";
import authRoutes from "./auth.routes";
import productsRoutes from "./products.routes";
import cartRoutes from "./cart.routes";
import ordersRoutes from "./orders.routes";
import paymentsRoutes from "./payments.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productsRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
// aquí luego agregamos products, cart, orders, payments

export default router;
