import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().min(1),
});

export type AddToCartDTO = z.infer<typeof addToCartSchema>;
export type UpdateCartItemDTO = z.infer<typeof updateCartItemSchema>;
