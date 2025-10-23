import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./config/swagger";

// Stripe Webhook: RAW body
import { rawBodyBuffer } from "./middlewares/rawbody.middleware";

const app = express();
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * ✅ 1) RAW BODY SOLO para Stripe Webhook
 *    — Esta ruta se declara ANTES del JSON parser
 */
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json", verify: rawBodyBuffer }),
  routes // <-- el webhook real será resuelto por payments.routes
);

/**
 * ✅ 2) JSON normal para todas las demás rutas
 */
app.use(express.json());
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan("dev"));

/**
 * ✅ 3) Swagger Docs
 */
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * ✅ 4) API Routes
 */
app.use("/api", routes);

/**
 * ✅ 5) Error Handler
 */
app.use(errorMiddleware);

/**
 * ✅ 6) Health Check
 */
app.get("/", (_req, res) => {
  res.json({ message: "Ecommerce API 🚀" });
});

export default app;
