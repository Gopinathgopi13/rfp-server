import { Router } from "express";
import auth from "./auth";
import vendor from "./vendor";
import rfp from "./rfp";

export default () => {
    const app = Router();
    auth(app);
    vendor(app);
    rfp(app);
    return app;
}
