import { prisma } from "../config/prisma";
import { CreateProductDTO, UpdateProductDTO } from "../dtos/product.dto";
import { Prisma } from "@prisma/client";

export class ProductsService {
  async upsertCategoryByName(name: string) {
    return prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async create(data: CreateProductDTO) {
    let categoryId: number | undefined = undefined;

    // ✅ SI viene categoryName → siempre crea/usa categoría y se ignora categoryId
    if (data.categoryName) {
      const cat = await this.upsertCategoryByName(data.categoryName);
      categoryId = cat.id;
    }
    // ✅ SOLO si NO viene categoryName → usamos categoryId
    else if (data.categoryId) {
      categoryId = data.categoryId;
    }

    return prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency ?? "usd",
        stock: data.stock ?? 0,
        imageUrl: data.imageUrl,
        categoryId,
      },
    });
  }

  async list(params: any) {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    minPrice,
    maxPrice,
    sort,
  } = params;

  const where: any = { active: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { name: { equals: category, mode: "insensitive" } };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
  sort === "price.asc"
    ? { price: "asc" }
    : sort === "price.desc"
    ? { price: "desc" }
    : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    items,
  };
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
  let categoryId: number | undefined = undefined;

  // Copiamos el body para manipularlo sin romper req.body
  const updateData: any = { ...data };

  // ✅ Si viene categoryName → buscamos/creamos categoría y eliminamos categoryName del DTO
  if (data.categoryName) {
    const cat = await this.upsertCategoryByName(data.categoryName);
    categoryId = cat.id;
    delete updateData.categoryName;
    delete updateData.categoryId; // ignoramos categoryId si viene junto con categoryName
  }
  // ✅ Si SOLO viene categoryId → usamos categoryId
  else if (data.categoryId) {
    categoryId = data.categoryId;
    delete updateData.categoryName;
  }

  return prisma.product.update({
    where: { id },
    data: {
      ...updateData,
      categoryId,
    },
  });
}

  async softDelete(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, active: true },
  });

  if (!product) {
    throw new Error("Producto no encontrado o ya está desactivado");
  }

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  return { message: "Producto desactivado correctamente" };
}
}