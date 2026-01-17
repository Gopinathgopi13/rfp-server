import { Router } from "express";
import logger from "../../../loaders/logger";
import helper from "../../../helpers/index";
import Container from "typedi";
import RFPService from "../../../service/rfp";
import { generateRFPSchema, createRFPSchema, sendRFPToVendorsSchema } from "../../../validation/index";
import { rfpProposalRoutes } from "./proposal";

const route = Router();

export default (app: Router) => {
    app.use("/rfp", route);

    // Register RFP-specific proposal routes
    rfpProposalRoutes(route);

    // Generate RFP from natural language
    route.post("/generate", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            const { rawInput } = req.body;
            const parsedData = await rfpService.generateRFP(rawInput);
            res.json({
                status: true,
                message: "RFP generated successfully",
                data: parsedData
            });
        } catch (error) {
            logger.error("Generate RFP error", error);
            helper.handleError(error, res);
        }
    });

    // Create RFP
    route.post("/", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {

            const validation = createRFPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    status: false,
                    message: "Validation error",
                    errors: validation.error.issues
                });
            }

            const rfp = await rfpService.createRFP(validation.data);
            res.status(201).json({
                status: true,
                message: "RFP created successfully",
                data: rfp
            });
        } catch (error) {
            logger.error("Create RFP error", error);
            helper.handleError(error, res);
        }
    });

    // Get all RFPs
    route.get("/", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            const { page = 1, size = 10, search } = req.query;

            const rfps = await rfpService.getAllRFPs(
                Number(page),
                Number(size),
                search as string | undefined
            );
            res.json({
                status: true,
                message: "RFPs fetched successfully",
                data: rfps
            });
        } catch (error) {
            logger.error("Get all RFPs error", error);
            helper.handleError(error, res);
        }
    });

    // Get RFP by ID
    route.get("/:id", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            const rfp = await rfpService.getRFPById(req.params.id);
            if (!rfp) {
                return res.status(404).json({
                    status: false,
                    message: "RFP not found"
                });
            }
            res.json({
                status: true,
                message: "RFP fetched successfully",
                data: rfp
            });
        } catch (error) {
            logger.error("Get RFP by ID error", error);
            helper.handleError(error, res);
        }
    });

    // Update RFP
    route.put("/:id", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {

            const validation = createRFPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    status: false,
                    message: "Validation error",
                    errors: validation.error.issues
                });
            }

            const rfp = await rfpService.updateRFP(req.params.id, validation.data);
            res.json({
                status: true,
                message: "RFP updated successfully",
                data: rfp
            });
        } catch (error) {
            logger.error("Update RFP error", error);
            helper.handleError(error, res);
        }
    });

    // Delete RFP
    route.delete("/:id", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            await rfpService.deleteRFP(req.params.id);
            res.json({
                status: true,
                message: "RFP deleted successfully"
            });
        } catch (error) {
            logger.error("Delete RFP error", error);
            helper.handleError(error, res);
        }
    });

    // Send RFP to Vendors
    route.post("/:id/send", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            const validation = sendRFPToVendorsSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    status: false,
                    message: "Validation error",
                    errors: validation.error.issues
                });
            }

            const result = await rfpService.sendRFPToVendors(
                req.params.id,
                validation.data.vendorIds
            );

            res.json({
                status: true,
                message: result.failedCount > 0
                    ? `RFP sent to ${result.sentCount} vendor(s). ${result.failedCount} failed.`
                    : `RFP sent to ${result.sentCount} vendor(s) successfully`,
                data: result
            });
        } catch (error) {
            logger.error("Send RFP to vendors error", error);
            helper.handleError(error, res);
        }
    });
};