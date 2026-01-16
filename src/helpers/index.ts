import { Prisma } from "@prisma/client";
import { Response } from "express";
import { HttpError } from "../api/errors";


function handleError(error: any, res: Response) {
    if (error instanceof HttpError) {
        return res.status(error.httpCode || 500).json({
            status: false,
            message: error.message,
        });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                return res.status(409).json({
                    status: false,
                    message: `Duplicate value for field: ${(error.meta as any)?.target}`,
                });
            case "P2025":
                return res.status(404).json({
                    status: false,
                    message: "Record not found",
                });
            default:
                return res.status(400).json({
                    status: false,
                    message: `Database error`,
                });
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            status: false,
            message: "Validation error",
        });
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        return res.status(500).json({
            status: false,
            message: "Unknown database error",
        });
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        return res.status(500).json({
            status: false,
            message: "Database initialization error",
        });
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
        return res.status(500).json({
            status: false,
            message: "Unexpected database panic",
        });
    }
    return res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
    });
}


export default {
    handleError
}