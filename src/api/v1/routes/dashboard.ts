import { Router } from "express";
import logger from "../../../loaders/logger";
import helper from "../../../helpers/index";
import Container from "typedi";
import DashboardService from "../../../service/dashboard";

const route = Router();

export default (app: Router) => {
    app.use("/dashboard", route);

    /**
     * GET /api/v1/dashboard
     * Get comprehensive dashboard data including stats, trends, and recent activity
     */
    route.get("/", async (req, res) => {
        const dashboardService = Container.get(DashboardService);
        try {
            const dashboardData = await dashboardService.getDashboardData();

            res.json({
                status: true,
                message: "Dashboard data retrieved successfully",
                data: dashboardData
            });
        } catch (error) {
            logger.error("Dashboard error", error);
            helper.handleError(error, res);
        }
    });
};
