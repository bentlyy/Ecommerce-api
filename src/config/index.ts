import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  baseUrl: process.env.BASE_URL!,
};
