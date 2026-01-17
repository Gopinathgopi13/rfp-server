import { Router } from "express";
import logger from "../../../loaders/logger";
import helper from "../../../helpers/index";
import Container from "typedi";
import ProposalService from "../../../service/proposal";
import { createProposalSchema, updateProposalStatusSchema } from "../../../validation/proposal";

const route = Router();

export default (app: Router) => {
    app.use("/proposal", route);

    // Get proposal by ID
    route.get("/:id", async (req, res) => {
        const proposalService = Container.get(ProposalService);
        try {
            const proposal = await proposalService.getById(req.params.id);
            if (!proposal) {
                return res.status(404).json({
                    status: false,
                    message: "Proposal not found"
                });
            }
            res.json({
                status: true,
                message: "Proposal fetched successfully",
                data: proposal
            });
        } catch (error) {
            logger.error("Get proposal error", error);
            helper.handleError(error, res);
        }
    });

    // Update proposal status
    route.patch("/:id/status", async (req, res) => {
        const proposalService = Container.get(ProposalService);
        try {
            const validation = updateProposalStatusSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    status: false,
                    message: "Validation error",
                    errors: validation.error.issues
                });
            }

            const proposal = await proposalService.updateStatus(req.params.id, validation.data);
            res.json({
                status: true,
                message: "Proposal status updated successfully",
                data: proposal
            });
        } catch (error) {
            logger.error("Update proposal status error", error);
            helper.handleError(error, res);
        }
    });

    // Re-analyze proposal with AI
    route.post("/:id/reanalyze", async (req, res) => {
        const proposalService = Container.get(ProposalService);
        try {
            const proposal = await proposalService.analyzeProposal(req.params.id);
            res.json({
                status: true,
                message: "Proposal re-analyzed successfully",
                data: proposal
            });
        } catch (error) {
            logger.error("Re-analyze proposal error", error);
            helper.handleError(error, res);
        }
    });

    // Delete proposal
    route.delete("/:id", async (req, res) => {
        const proposalService = Container.get(ProposalService);
        try {
            await proposalService.delete(req.params.id);
            res.json({
                status: true,
                message: "Proposal deleted successfully"
            });
        } catch (error) {
            logger.error("Delete proposal error", error);
            helper.handleError(error, res);
        }
    });
};

// RFP-specific proposal routes
export const rfpProposalRoutes = (rfpRoute: Router) => {
    // Get all proposals for an RFP
    rfpRoute.get("/:rfpId/proposals", async (req, res) => {
        const proposalService = Container.get(ProposalService);
        try {
            const proposals = await proposalService.getByRFP(req.params.rfpId);
            res.json({
                status: true,
                message: "Proposals fetched successfully",
                data: proposals
            });
        } catch (error) {
            logger.error("Get RFP proposals error", error);
            helper.handleError(error, res);
        }
    });

    // Get recommended proposal for an RFP
    rfpRoute.get("/:rfpId/proposals/recommended", async (req, res) => {
        const proposalService = Container.get(ProposalService);
        try {
            const proposal = await proposalService.getRecommended(req.params.rfpId);
            res.json({
                status: true,
                message: proposal ? "Recommended proposal fetched successfully" : "No recommended proposal found",
                data: proposal
            });
        } catch (error) {
            logger.error("Get recommended proposal error", error);
            helper.handleError(error, res);
        }
    });
};
