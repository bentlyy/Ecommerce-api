import { prisma } from "../config/prisma";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";

export class AuthService {
  private signToken(userId: number, role: "ADMIN" | "CUSTOMER") {
    const payload = { userId, role };
    const options: SignOptions = { expiresIn: config.jwtExpiresIn as any };
    return jwt.sign(payload, config.jwtSecret as string, options);
  }

  async register(data: RegisterDTO) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("El email ya está registrado");

    const hash = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: data.role ?? "CUSTOMER",
      },
    });

    const token = this.signToken(user.id, user.role);
    return { user, token };
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error("Credenciales inválidas");

    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) throw new Error("Credenciales inválidas");

    const token = this.signToken(user.id, user.role);
    return { user, token };
  }
}
