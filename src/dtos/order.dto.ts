import { z } from "zod";

// Status definidos en tu schema.prisma
export const orderStatusEnum = z.enum([
  "PENDING",
  "REQUIRES_PAYMENT_METHOD",
  "REQUIRES_CONFIRMATION",
  "CANCELED",
  "PAID",
  "FAILED",
]);

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: orderStatusEnum.optional(),
});

export type ListOrdersQueryDTO = z.infer<typeof listOrdersQuerySchema>;

// Admin: filtros opcionales
export const adminListOrdersQuerySchema = listOrdersQuerySchema.extend({
  userId: z.coerce.number().int().optional(),
});

export type AdminListOrdersQueryDTO = z.infer<typeof adminListOrdersQuerySchema>;
