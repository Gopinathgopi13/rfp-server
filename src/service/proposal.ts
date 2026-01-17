import { Service } from "typedi";
import Container from "typedi";
import { Proposal, Prisma } from "@prisma/client";
import prisma from "../loaders/prisma";
import logger from "../loaders/logger";
import ProposalAIService from "./proposal-ai";
import { CreateProposalInput, UpdateProposalInput } from "../types/proposal.types";

type ProposalWithVendor = Proposal & {
    vendor: {
        id: string;
        name: string;
        email: string;
    };
};

@Service()
export default class ProposalService {
    async create(data: CreateProposalInput): Promise<Proposal> {
        try {
            logger.info(`Creating proposal for RFP: ${data.rfpId} from vendor: ${data.vendorId}`);

            const rfp = await prisma.rFP.findUnique({
                where: { id: data.rfpId },
                include: { items: true }
            });

            if (!rfp) {
                throw new Error("RFP not found");
            }

            const vendor = await prisma.vendor.findUnique({
                where: { id: data.vendorId }
            });

            if (!vendor) {
                throw new Error("Vendor not found");
            }

            const proposal = await prisma.proposal.create({
                data: {
                    rfpId: data.rfpId,
                    vendorId: data.vendorId,
                    rawContent: data.rawContent,
                    emailSubject: data.emailSubject,
                    status: "pending"
                }
            });

            this.analyzeProposal(proposal.id).catch(error => {
                logger.error(`Background AI analysis failed for proposal ${proposal.id}:`, error);
            });

            return proposal;
        } catch (error) {
            logger.error("Create proposal error", error);
            throw error;
        }
    }

    async analyzeProposal(proposalId: string): Promise<Proposal> {
        try {
            logger.info(`Analyzing proposal: ${proposalId}`);

            const proposal = await prisma.proposal.findUnique({
                where: { id: proposalId },
                include: {
                    rfp: { include: { items: true } }
                }
            });

            if (!proposal) {
                throw new Error("Proposal not found");
            }

            const aiService = Container.get(ProposalAIService);
            const analysis = await aiService.analyzeProposal(
                {
                    title: proposal.rfp.title,
                    description: proposal.rfp.description,
                    budget: proposal.rfp.budget ? Number(proposal.rfp.budget) : null,
                    deliveryDeadline: proposal.rfp.deliveryDeadline?.toISOString() || null,
                    paymentTerms: proposal.rfp.paymentTerms,
                    warranty: proposal.rfp.warranty,
                    items: proposal.rfp.items.map(item => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                        specifications: item.specifications
                    }))
                },
                proposal.rawContent
            );

            const updatedProposal = await prisma.proposal.update({
                where: { id: proposalId },
                data: {
                    proposedPrice: analysis.proposedPrice,
                    deliveryDays: analysis.deliveryDays,
                    warranty: analysis.warranty,
                    paymentTerms: analysis.paymentTerms,
                    itemPricing: analysis.itemPricing as Prisma.InputJsonValue,
                    strengths: analysis.strengths as Prisma.InputJsonValue,
                    weaknesses: analysis.weaknesses as Prisma.InputJsonValue,
                    score: analysis.score,
                    recommendation: analysis.recommendation,
                    status: "analyzed"
                }
            });

            await this.updateRecommendations(proposal.rfpId);

            return updatedProposal;
        } catch (error) {
            logger.error("Analyze proposal error", error);
            throw error;
        }
    }

    async updateRecommendations(rfpId: string): Promise<void> {
        try {
            logger.info(`Updating recommendations for RFP: ${rfpId}`);

            const proposals = await prisma.proposal.findMany({
                where: {
                    rfpId,
                    status: "analyzed",
                    score: { not: null }
                },
                orderBy: { score: "desc" }
            });

            if (proposals.length === 0) return;

            await prisma.proposal.updateMany({
                where: { rfpId },
                data: { isRecommended: false }
            });

            await prisma.proposal.update({
                where: { id: proposals[0].id },
                data: { isRecommended: true }
            });
        } catch (error) {
            logger.error("Update recommendations error", error);
            throw error;
        }
    }

    async getByRFP(rfpId: string): Promise<ProposalWithVendor[]> {
        try {
            const proposals = await prisma.proposal.findMany({
                where: { rfpId },
                include: {
                    vendor: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: [
                    { isRecommended: "desc" },
                    { score: "desc" }
                ]
            });
            return proposals;
        } catch (error) {
            logger.error("Get proposals by RFP error", error);
            throw error;
        }
    }

    async getById(id: string): Promise<ProposalWithVendor | null> {
        try {
            const proposal = await prisma.proposal.findUnique({
                where: { id },
                include: {
                    vendor: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
            return proposal;
        } catch (error) {
            logger.error("Get proposal by ID error", error);
            throw error;
        }
    }

    async getRecommended(rfpId: string): Promise<ProposalWithVendor | null> {
        try {
            const proposal = await prisma.proposal.findFirst({
                where: {
                    rfpId,
                    isRecommended: true
                },
                include: {
                    vendor: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
            return proposal;
        } catch (error) {
            logger.error("Get recommended proposal error", error);
            throw error;
        }
    }
    async updateStatus(id: string, data: UpdateProposalInput): Promise<Proposal> {
        try {
            const proposal = await prisma.proposal.update({
                where: { id },
                data: {
                    status: data.status,
                    isRecommended: data.isRecommended
                }
            });
            return proposal;
        } catch (error) {
            logger.error("Update proposal status error", error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const proposal = await prisma.proposal.findUnique({ where: { id } });
            if (!proposal) {
                throw new Error("Proposal not found");
            }

            await prisma.proposal.delete({ where: { id } });

            await this.updateRecommendations(proposal.rfpId);
        } catch (error) {
            logger.error("Delete proposal error", error);
            throw error;
        }
    }
}
