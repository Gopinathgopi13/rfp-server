import bcrypt from "bcryptjs";
import { Logger } from "winston";
import { Inject, Service } from "typedi";
import { PrismaClient, Users } from "@prisma/client";
import { LoginResponse } from "../types/index";

@Service()
export default class AuthService {
    constructor(
        @Inject("logger") private logger: Logger,
        @Inject("prisma") private prisma: PrismaClient
    ) { }
    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const user = await this.prisma.users.findUnique({ where: { email } });
            if (!user) {
                throw new Error("User not found");
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error("Invalid password");
            }
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                token: user.token || "",
                token_expiry: user.token_expiry || new Date(),
            };
        } catch (error) {
            this.logger.error("Login error", error);
            throw error;
        }
    }
}