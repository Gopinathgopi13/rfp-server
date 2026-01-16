import "reflect-metadata";
import http from "http";
import express from "express";
import loaders from "./loaders";
import config from "./config";
import logger from "./loaders/logger";

let app = express();

(async () => {
    try {
        const server = http.createServer(app);
        await loaders(app);
        server.listen(config.port, () => {
            logger.info(`🛡️  Server listening on port: ${config.port} 🛡️`);
        })
            .on("error", (err) => {
                logger.error("Server listen error:");
                console.error(err)
                process.exit(1);
            });

        process.on("uncaughtException", (err) => {
            logger.error("Uncaught Exception:");
            console.log(err)
            process.exit(1);
        });

        process.on("unhandledRejection", (reason) => {
            logger.error("Unhandled Rejection:");
            console.log(reason)
            process.exit(1);
        });
    } catch (error) {

    }
})();