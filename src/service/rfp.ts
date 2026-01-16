import { Service } from "typedi";
import Container from "typedi";
import { RFP } from "@prisma/client";
import { ParsedRFPData, SaveRFPRequest } from "../types/rfp.types";
import AIService from "./ai";
import prisma from "../loaders/prisma";
import logger from "../loaders/logger";

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

@Service()
export default class RFPService {
    async generateRFP(rawInput: string): Promise<ParsedRFPData> {
        try {
            logger.info("Generating RFP from natural language");
            const aiService = Container.get(AIService);
            const parsedData = await aiService.parseRFPFromNaturalLanguage(rawInput);
            return parsedData;
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
                        deliveryDeadline: data.deliveryDeadline ? new Date(data.deliveryDeadline) : null,
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

    async getAllRFPs(): Promise<RFPWithItems[]> {
        try {
            logger.info("Getting all RFPs");
            const rfps = await prisma.rFP.findMany({
                include: { items: true },
                orderBy: { createdAt: "desc" }
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
                // Delete existing items
                await tx.rFPItem.deleteMany({
                    where: { rfpId: id }
                });

                // Update RFP and create new items
                const updatedRFP = await tx.rFP.update({
                    where: { id },
                    data: {
                        title: data.title,
                        description: data.description || null,
                        rawInput: data.rawInput,
                        budget: data.budget || null,
                        deliveryDeadline: data.deliveryDeadline ? new Date(data.deliveryDeadline) : null,
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
}
