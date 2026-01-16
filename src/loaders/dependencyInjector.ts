import Container from "typedi"
import logger from "./logger"
import prisma from "./prisma"

export default () => {
    try {
        Container.set("logger", logger)
        Container.set("prisma", prisma)
        logger.info("Dependency Injector loaded successfully")
    } catch (error) {
        logger.error("Error in dependencyInjector", error)
    }
}