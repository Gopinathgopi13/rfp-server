import { Router } from "express";
import logger from "../../../loaders/logger";
import helper from "../../../helpers/index";
import Container from "typedi";
import VendorService from "../../../service/vendor";

const route = Router();

export default (app: Router) => {
    app.use("/vendor", route);

    // List all vendors
    route.get("/", async (req, res) => {
        const vendorService = Container.get(VendorService);
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : undefined;
            const size = req.query.size ? parseInt(req.query.size as string) : undefined;
            const search = req.query.search ? req.query.search as string : undefined;
            const { vendors, total, totalPages } = await vendorService.list(page, size, search);
            res.json({
                status: true,
                message: "Vendors fetched successfully",
                data: vendors,
                pagination: {
                    total,
                    page: page || null,
                    size: size || null,
                    totalPages: totalPages || null
                }
            });
        } catch (error) {
            logger.error("List vendors error", error);
            helper.handleError(error, res);
        }
    });

    route.get("/category", async (req, res) => {
        const vendorService = Container.get(VendorService);
        try {
            const vendors = await vendorService.listCategory();
            res.json({
                status: true,
                message: "Vendors fetched successfully",
                data: vendors,
            });
        } catch (error) {
            logger.error("List vendors error", error);
            helper.handleError(error, res);
        }
    });


    // Get vendor by ID
    route.get("/:id", async (req, res) => {
        const vendorService = Container.get(VendorService);
        try {
            const vendor = await vendorService.getById(req.params.id);
            if (!vendor) {
                return res.status(404).json({
                    status: false,
                    message: "Vendor not found",
                });
            }
            res.json({
                status: true,
                message: "Vendor fetched successfully",
                data: vendor,
            });
        } catch (error) {
            logger.error("Get vendor error", error);
            helper.handleError(error, res);
        }
    });


    // Create vendor
    route.post("/", async (req, res) => {
        const vendorService = Container.get(VendorService);
        try {
            const { name, email, phone, vendorCategoryId } = req.body;
            const vendor = await vendorService.create({ name, email, phone, vendorCategoryId });
            res.status(201).json({
                status: true,
                message: "Vendor created successfully",
                data: vendor,
            });
        } catch (error) {
            logger.error("Create vendor error", error);
            helper.handleError(error, res);
        }
    });

    // Update vendor
    route.put("/:id", async (req, res) => {
        const vendorService = Container.get(VendorService);
        try {
            const { name, email, phone, vendorCategoryId, is_active } = req.body;
            const vendor = await vendorService.update(req.params.id, { name, email, phone, vendorCategoryId, is_active });
            res.json({
                status: true,
                message: "Vendor updated successfully",
                data: vendor,
            });
        } catch (error) {
            logger.error("Update vendor error", error);
            helper.handleError(error, res);
        }
    });

    // Delete vendor
    route.delete("/:id", async (req, res) => {
        const vendorService = Container.get(VendorService);
        try {
            const vendor = await vendorService.delete(req.params.id);
            res.json({
                status: true,
                message: "Vendor deleted successfully",
                data: vendor,
            });
        } catch (error) {
            logger.error("Delete vendor error", error);
            helper.handleError(error, res);
        }
    });
};
