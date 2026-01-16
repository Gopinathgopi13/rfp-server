import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
    ),
    defaultMeta: { service: "rfp-server" },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                errors({ stack: true }),
                logFormat
            ),
        }),
        // File transport for errors
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: "logs/combined.log",
        }),
    ],
});

// Don't log to files in development
if (process.env.NODE_ENV === "development") {
    logger.clear();
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                errors({ stack: true }),
                logFormat
            ),
        })
    );
}

export default logger;
