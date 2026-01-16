import { Router } from "express";
import { validateSchema } from "../../../middlewares/validateSchema";
import { loginSchema } from "../../../validation";
import logger from "../../../loaders/logger";
import helper from "../../../helpers/index";
import Container from "typedi";
import AuthService from "../../../service/auth";

const route = Router();

export default (app: Router) => {
    app.use("/auth", route);

    route.post("/login",
        validateSchema(loginSchema),
        async (req, res) => {
            const authService = Container.get(AuthService);
            logger.info("Login request", req.body);
            try {
                const { email, password } = req.body;
                const user = await authService.login(email, password);
                res.json({
                    status: true,
                    message: "Login successful",
                    data: user,
                })
            } catch (error) {
                logger.error("Login error", error);
                helper.handleError(error, res);
            }
        });
}