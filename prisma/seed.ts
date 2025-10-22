import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@ecom.test" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@ecom.test",
      password,
      role: "ADMIN"
    }
  });

  console.log("✅ Seed: admin@ecom.test / admin123");
}

main().finally(async () => prisma.$disconnect());
