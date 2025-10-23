import swaggerJsdoc from "swagger-jsdoc";

export const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce API",
      version: "1.0.0",
      description: "API para Ecommerce con autenticación, roles, carrito, órdenes y pagos con Stripe",
    },
    servers: [
      {
        url: "http://localhost:3000/api", // ✅ Swagger enviará todas las requests con /api
        description: "Local Server",
      },
      // Si después desplegamos en Railway agregamos aquí:
      // {
      //   url: "https://ecommerce-production.up.railway.app/api",
      //   description: "Production Server"
      // }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [], // ✅ Swagger enviará el JWT automáticamente
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // ✅ Swagger detectará los @swagger en las rutas
};
