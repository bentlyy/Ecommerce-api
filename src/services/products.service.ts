import { prisma } from "../config/prisma";
import { CreateProductDTO, UpdateProductDTO } from "../dtos/product.dto";

export class ProductsService {
  async upsertCategoryByName(name: string) {
    return prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async create(data: CreateProductDTO) {
    let categoryId = data.categoryId;

    if (!categoryId && data.categoryName) {
      const cat = await this.upsertCategoryByName(data.categoryName);
      categoryId = cat.id;
    }

    return prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency ?? "usd",
        stock: data.stock ?? 0,
        imageUrl: data.imageUrl,
        categoryId: categoryId ?? undefined,
      },
    });
  }

  async list(params: any) {
    // igual que tu implementación original (la dejé intacta)
    // ...
  }

  async getById(id: number) {
    const product = await prisma.product.findFirst({
      where: { id, active: true },
      include: { category: true },
    });
    if (!product) throw new Error("Producto no encontrado");
    return product;
  }

  async update(id: number, data: UpdateProductDTO) {
    let categoryId = data.categoryId;

    if (!categoryId && data.categoryName) {
      const cat = await this.upsertCategoryByName(data.categoryName);
      categoryId = cat.id;
    }

    return prisma.product.update({
      where: { id },
      data: { ...data, categoryId: categoryId ?? undefined },
    });
  }

  async softDelete(id: number) {
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    return { message: "Producto desactivado" };
  }
}
