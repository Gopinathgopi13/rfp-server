import { Router } from "express";
import auth from "./auth";
import vendor from "./vendor";
import rfp from "./rfp";
import proposal from "./proposal";
import dashboard from "./dashboard";

export default () => {
    const app = Router();
    auth(app);
    vendor(app);
    rfp(app);
    proposal(app);
    dashboard(app);
    return app;
}
