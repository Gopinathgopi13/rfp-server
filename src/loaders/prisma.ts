
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import logger from "./logger";
import config from "../config";

logger.info("Prisma Client loaded");

const pool = new Pool({
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
});

export async function connectPrisma() {
    try {
        await prisma.$connect();
        logger.info("Prisma Client connected");
    } catch (error) {
        logger.error("Prisma Client connection error", error);
    }
}

export async function disconnectPrisma() {
    try {
        await prisma.$disconnect();
        logger.info("Prisma Client disconnected");
    } catch (error) {
        logger.error("Prisma Client disconnection error", error);
    }
}

export default prisma;


