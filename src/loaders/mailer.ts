import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import config from "../config";

export type EmailOption = {
    email: string;
    subject: string;
    message: string;
    attachments?: Array<{
        filename: string;
        path: string;
    }>;
};

export const sendEmail = async (option: EmailOption): Promise<void> => {
    try {
        const transporter: Transporter = nodemailer.createTransport({
            host: config.mail.host,
            port: 587,
            secure: false,
            auth: {
                user: config.mail.username,
                pass: config.mail.password,
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
        });

        const mailOption = {
            from: config.mail.address,
            to: option.email,
            subject: option.subject,
            html: option.message,
            attachments: option.attachments,
        };

        await transporter.sendMail(mailOption);
    } catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Failed to send email");
    }
};
