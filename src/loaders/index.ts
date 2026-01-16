import { Express } from "express";
import dependencyInjector from "./dependencyInjector";
import expressLoader from "./express";
import { connectPrisma } from "./prisma";

export default async (app: Express) => {
    await dependencyInjector()
    await connectPrisma()
    expressLoader({ app })
}