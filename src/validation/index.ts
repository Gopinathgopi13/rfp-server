import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const generateRFPSchema = z.object({
    rawInput: z.string()
        .min(10, { message: "Input must be at least 10 characters" })
        .max(5000, { message: "Input must not exceed 5000 characters" })
});

export type GenerateRFPSchema = z.infer<typeof generateRFPSchema>;

export const parsedItemSchema = z.object({
    name: z.string().min(1, { message: "Item name is required" }),
    quantity: z.number().int().positive({ message: "Quantity must be a positive integer" }),
    specifications: z.record(z.string(), z.any()).optional().default({})
});

export type ParsedItemSchema = z.infer<typeof parsedItemSchema>;

export const createRFPSchema = z.object({
    title: z.string().min(1).max(255, { message: "Title must not exceed 255 characters" }),
    description: z.string().nullable().optional().default(""),
    rawInput: z.string().min(1, { message: "Raw input is required" }),
    budget: z.number().positive().nullable().optional(),
    deliveryDeadline: z.string().nullable().optional(),
    paymentTerms: z.string().nullable().optional(),
    warranty: z.string().nullable().optional(),
    additionalRequirements: z.array(z.string()).optional().default([]),
    items: z.array(parsedItemSchema).min(1, { message: "At least one item is required" })
});

export type CreateRFPSchema = z.infer<typeof createRFPSchema>;

export const sendRFPToVendorsSchema = z.object({
    vendorIds: z.array(z.string().uuid({ message: "Invalid vendor ID" }))
        .min(1, { message: "At least one vendor must be selected" })
});

export type SendRFPToVendorsSchema = z.infer<typeof sendRFPToVendorsSchema>;