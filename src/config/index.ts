import dotenv from "dotenv";

const envFound = dotenv.config();
if (envFound.error) {
    throw new Error("⚠️ Couldn't find .env file ⚠️");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.PORT = process.env.PORT || "8000";

process.env.DATABASE_URL = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT || 5432}/${process.env.DATABASE_NAME}?schema=public`;

export default {
    port: parseInt(process.env.PORT) || 8000,
    database: {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    },
    mail: {
        host: process.env.MAIL_HOST,
        address: process.env.MAIL_ADD,
        password: process.env.MAIL_PASS,
        username: process.env.MAIL_USER,
        port: parseInt(process.env.MAIL_PORT || "587"),
    },
    imap: {
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT || "993"),
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        pollInterval: parseInt(process.env.IMAP_POLL_INTERVAL || "60000"),
    }
}