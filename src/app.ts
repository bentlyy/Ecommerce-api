import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./config/swagger";

// Stripe webhook necesita raw body
import { rawBodyBuffer } from "./middlewares/rawbody.middleware";

const app = express();
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * 1) RAW BODY para Stripe Webhook — ANTES de express.json()
 *    Esta ruta NO debe usar json(), porque Stripe valida la firma del body
 */
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json", verify: rawBodyBuffer })
);

/**
 * 2) JSON NORMAL para el resto de la API
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
 * 3) Swagger
 */
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * 4) Rutas API
 */
app.use("/api", routes);

/**
 * 5) Middleware de errores (último siempre)
 */
app.use(errorMiddleware);

/**
 * 6) Ruta raíz
 */
app.get("/", (_req, res) => {
  res.json({ message: "Ecommerce API 🚀" });
});

export default app;
