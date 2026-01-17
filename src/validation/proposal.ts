import { z } from "zod";

export const createProposalSchema = z.object({
    rfpId: z.string().uuid({ message: "Invalid RFP ID" }),
    vendorId: z.string().uuid({ message: "Invalid vendor ID" }),
    rawContent: z.string().min(10, { message: "Proposal content must be at least 10 characters" }),
    emailSubject: z.string().optional()
});

export type CreateProposalSchema = z.infer<typeof createProposalSchema>;

export const updateProposalStatusSchema = z.object({
    status: z.enum(["pending", "analyzed", "accepted", "rejected"]).optional(),
    isRecommended: z.boolean().optional()
});

export type UpdateProposalStatusSchema = z.infer<typeof updateProposalStatusSchema>;
