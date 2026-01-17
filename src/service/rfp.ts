import { Service } from "typedi";
import Container from "typedi";
import { RFP } from "@prisma/client";
import { ParsedRFPData, SaveRFPRequest } from "../types/rfp.types";
// import AIService from "./ai"; // OpenAI 
// import GeminiAIService from "./gemini-ai"; // Gemini AI
import prisma from "../loaders/prisma";
import logger from "../loaders/logger";
import ClaudeAIService from "./claude-ai";
import { sendEmail } from "../loaders/mailer";
import { renderFile, TEMPLATE } from "../templates";

type RFPWithItems = RFP & {
    items: {
        id: string;
        rfpId: string;
        itemName: string;
        quantity: number;
        specifications: any;
        createdAt: Date;
    }[];
};

function parseDeliveryDeadline(deadline: string | null | undefined): Date | null {
    if (!deadline) return null;
    const isoDate = new Date(deadline);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    const daysMatch = deadline.match(/^(\d+)\s*(?:days?)?$/i);
    if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return futureDate;
    }
    logger.warn(`Could not parse deliveryDeadline: ${deadline}`);
    return null;
}

@Service()
export default class RFPService {
    async generateRFP(rawInput: string): Promise<ParsedRFPData> {
        try {
            logger.info("Generating RFP from natural language");
            // const aiService = Container.get(AIService); // OpenAI
            // const aiService = Container.get(GeminiAIService); // Using Gemini AI
            const aiService = Container.get(ClaudeAIService);
            const parsedData = await aiService.parseRFPFromNaturalLanguage(rawInput);
            return { ...parsedData, rawInput };
        } catch (error) {
            logger.error("Generate RFP error", error);
            throw error;
        }
    }

    async createRFP(data: SaveRFPRequest): Promise<RFPWithItems> {
        try {
            logger.info("Creating RFP");

            const rfp = await prisma.$transaction(async (tx) => {
                const createdRFP = await tx.rFP.create({
                    data: {
                        title: data.title,
                        description: data.description || null,
                        rawInput: data.rawInput,
                        budget: data.budget || null,
                        deliveryDeadline: parseDeliveryDeadline(data.deliveryDeadline),
                        paymentTerms: data.paymentTerms || null,
                        warranty: data.warranty || null,
                        additionalRequirements: data.additionalRequirements || [],
                        items: {
                            create: data.items.map(item => ({
                                itemName: item.name,
                                quantity: item.quantity,
                                specifications: item.specifications || {}
                            }))
                        }
                    },
                    include: { items: true }
                });

                return createdRFP;
            });

            return rfp;
        } catch (error) {
            logger.error("Create RFP error", error);
            throw error;
        }
    }

    async getAllRFPs(page: number, size: number, search?: string): Promise<RFPWithItems[]> {
        try {
            logger.info("Getting all RFPs");
            const skip = (page - 1) * size;
            const take = size;
            const where = search ? { title: { contains: search } } : undefined;
            const rfps = await prisma.rFP.findMany({
                include: { items: true },
                orderBy: { createdAt: "desc" },
                skip,
                take,
                where
            });
            return rfps;
        } catch (error) {
            logger.error("Get all RFPs error", error);
            throw error;
        }
    }

    async getRFPById(id: string): Promise<RFPWithItems | null> {
        try {
            logger.info(`Getting RFP by ID: ${id}`);
            const rfp = await prisma.rFP.findUnique({
                where: { id },
                include: { items: true }
            });
            return rfp;
        } catch (error) {
            logger.error("Get RFP by ID error", error);
            throw error;
        }
    }

    async updateRFP(id: string, data: SaveRFPRequest): Promise<RFPWithItems> {
        try {
            logger.info(`Updating RFP: ${id}`);

            const existingRFP = await prisma.rFP.findUnique({ where: { id } });
            if (!existingRFP) {
                throw new Error("RFP not found");
            }

            const rfp = await prisma.$transaction(async (tx) => {
                await tx.rFPItem.deleteMany({
                    where: { rfpId: id }
                });
                const updatedRFP = await tx.rFP.update({
                    where: { id },
                    data: {
                        title: data.title,
                        description: data.description || null,
                        rawInput: data.rawInput,
                        budget: data.budget || null,
                        deliveryDeadline: parseDeliveryDeadline(data.deliveryDeadline),
                        paymentTerms: data.paymentTerms || null,
                        warranty: data.warranty || null,
                        additionalRequirements: data.additionalRequirements || [],
                        items: {
                            create: data.items.map(item => ({
                                itemName: item.name,
                                quantity: item.quantity,
                                specifications: item.specifications || {}
                            }))
                        }
                    },
                    include: { items: true }
                });

                return updatedRFP;
            });

            return rfp;
        } catch (error) {
            logger.error("Update RFP error", error);
            throw error;
        }
    }

    async deleteRFP(id: string): Promise<void> {
        try {
            logger.info(`Deleting RFP: ${id}`);

            const existingRFP = await prisma.rFP.findUnique({ where: { id } });
            if (!existingRFP) {
                throw new Error("RFP not found");
            }

            await prisma.rFP.delete({
                where: { id }
            });
        } catch (error) {
            logger.error("Delete RFP error", error);
            throw error;
        }
    }

    async sendRFPToVendors(rfpId: string, vendorIds: string[]): Promise<{ sentCount: number; failedCount: number; failedVendors: string[] }> {
        try {
            logger.info(`Sending RFP ${rfpId} to ${vendorIds.length} vendors`);

            const rfp = await prisma.rFP.findUnique({
                where: { id: rfpId },
                include: { items: true }
            });

            if (!rfp) {
                throw new Error("RFP not found");
            }

            const vendors = await prisma.vendor.findMany({
                where: { id: { in: vendorIds } }
            });

            if (vendors.length === 0) {
                throw new Error("No valid vendors found");
            }

            let sentCount = 0;
            let failedCount = 0;
            const failedVendors: string[] = [];

            for (const vendor of vendors) {
                try {
                    const emailContent = renderFile(TEMPLATE.RFP, {
                        rfp,
                        vendorName: vendor.name
                    });

                    await sendEmail({
                        email: vendor.email,
                        subject: `RFP Invitation: ${rfp.title}`,
                        message: emailContent
                    });

                    sentCount++;
                    logger.info(`Email sent to vendor: ${vendor.email}`);
                } catch (emailError) {
                    failedCount++;
                    failedVendors.push(vendor.name);
                    logger.error(`Failed to send email to ${vendor.email}:`, emailError);
                }
            }

            if (sentCount > 0) {
                await prisma.rFP.update({
                    where: { id: rfpId },
                    data: { status: "sent" }
                });
            }

            return { sentCount, failedCount, failedVendors };
        } catch (error) {
            logger.error("Send RFP to vendors error", error);
            throw error;
        }
    }
}
