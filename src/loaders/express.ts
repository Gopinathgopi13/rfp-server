import express, { Express } from "express";
import cors from "cors";
import v1Routes from "../api/v1";
export default ({ app }: { app: Express }) => {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cors({
        origin: "*",
        methods: ['POST', "GET", "DELETE", "PUT"],
        credentials: true,
    }))

    app.get("/api/v1/health", (_, res) => {
        res.json({
            message: "Welcome to the API",
            status: true
        })
    })

    v1Routes.forEach((route) => {
        app.use("/api/v1", route());
    });
}