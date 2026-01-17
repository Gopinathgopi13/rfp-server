import bcrypt from "bcryptjs";
import { Service } from "typedi";
import { Users } from "@prisma/client";
import { LoginResponse } from "../types/index";
import prisma from "../loaders/prisma";
import logger from "../loaders/logger";

@Service()
export default class AuthService {
    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const user = await prisma.users.findUnique({ where: { email } });
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
            logger.error("Login error", error);
            throw error;
        }
    }
}