import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  currency: z.string().default("usd"),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
  // puedes crear por categoryId o por categoryName (uno de los dos)
  categoryId: z.number().int().positive().optional(),
  categoryName: z.string().min(2).optional(),
}).refine((data) => data.categoryId || data.categoryName || true, {
  message: "Puedes pasar categoryId o categoryName (opcional)",
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
