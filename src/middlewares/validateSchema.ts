import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateSchema = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: false,
          message: "Validate error",
          errors: error.issues.map((err: any) => ({
            path: err.path,
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};