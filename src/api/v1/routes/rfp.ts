import { Router } from "express";
import logger from "../../../loaders/logger";
import helper from "../../../helpers/index";
import Container from "typedi";
import RFPService from "../../../service/rfp";
import { generateRFPSchema, createRFPSchema } from "../../../validation/index";

const route = Router();

export default (app: Router) => {
    app.use("/rfp", route);

    // Generate RFP from natural language (AI parsing, no DB save)
    route.post("/generate", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            const { rawInput } = req.body;

            // Validate input
            const validation = generateRFPSchema.safeParse({ rawInput });
            if (!validation.success) {
                return res.status(400).json({
                    status: false,
                    message: "Validation error",
                    errors: validation.error.issues
                });
            }

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

    // Create RFP (save to database)
    route.post("/", async (req, res) => {
        const rfpService = Container.get(RFPService);
        try {
            // Validate input
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
            const rfps = await rfpService.getAllRFPs();
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
            // Validate input
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
};