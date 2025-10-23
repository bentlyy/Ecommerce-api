import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  currency: z.string().default("usd"),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),

  // ✅ Si viene categoryName, ignoramos categoryId
  categoryId: z.number().int().positive().optional(),
  categoryName: z.string().min(2).optional(),
}).refine((data) => data.categoryId || data.categoryName, {
  message: "Debes enviar categoryId o categoryName",
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  currency: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
  active: z.boolean().optional(),
  categoryId: z.number().int().positive().optional(),
  categoryName: z.string().min(2).optional(),
});

export type UpdateProductDTO = z.infer<typeof updateProductSchema>;