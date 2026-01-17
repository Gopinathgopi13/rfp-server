import { Service } from "typedi";
import Container from "typedi";
import { ImapFlow, FetchMessageObject } from "imapflow";
import { simpleParser } from "mailparser";
import config from "../config";
import logger from "../loaders/logger";
import prisma from "../loaders/prisma";
import ProposalService from "./proposal";

interface EmailMessage {
    uid: number;
    subject: string;
    from: string;
    date: Date;
    body: string;
}

@Service()
export default class EmailReceiverService {
    private client: ImapFlow | null = null;
    private pollTimer: NodeJS.Timeout | null = null;
    private isRunning = false;

    async start(): Promise<void> {
        if (!config.imap?.host || !config.imap?.user || !config.imap?.password) {
            logger.warn("IMAP configuration missing. Email receiver not started.");
            return;
        }

        logger.info(`Email receiver starting, polling every ${config.imap.pollInterval}ms`);
        this.isRunning = true;

        await this.pollInbox();

        this.pollTimer = setInterval(async () => {
            if (this.isRunning) {
                await this.pollInbox();
            }
        }, config.imap.pollInterval);
    }

    async stop(): Promise<void> {
        this.isRunning = false;

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        if (this.client) {
            await this.client.logout();
            this.client = null;
        }

        logger.info("Email receiver stopped");
    }

    private async connect(): Promise<ImapFlow> {
        const client = new ImapFlow({
            host: config.imap.host!,
            port: config.imap.port,
            secure: true,
            auth: {
                user: config.imap.user!,
                pass: config.imap.password!,
            },
            logger: false,
        });

        await client.connect();
        return client;
    }

    async pollInbox(): Promise<void> {
        let client: ImapFlow | null = null;

        try {
            client = await this.connect();
            await client.mailboxOpen("INBOX");

            const messages = client.fetch({ seen: false }, {
                uid: true,
                envelope: true,
                source: true,
            });

            const emailsToProcess: EmailMessage[] = [];

            for await (const message of messages) {
                try {
                    const parsed = await this.parseMessage(message);
                    if (parsed) {
                        emailsToProcess.push(parsed);
                    }
                } catch (parseError) {
                    logger.error("Error parsing email:", parseError);
                }
            }

            logger.info(`Found ${emailsToProcess.length} unread emails to process`);

            for (const email of emailsToProcess) {
                await this.processEmail(email, client);
            }

        } catch (error) {
            logger.error("Error polling inbox:", error);
        } finally {
            if (client) {
                await client.logout();
            }
        }
    }

    private async parseMessage(message: FetchMessageObject): Promise<EmailMessage | null> {
        try {
            if (!message.source) {
                logger.warn(`Message ${message.uid} has no source, skipping`);
                return null;
            }

            const parsed = await simpleParser(message.source);

            const fromAddress = parsed.from?.value?.[0]?.address || "";
            const subject = parsed.subject || "";
            const body = parsed.text || parsed.html || "";
            const date = parsed.date || new Date();

            return {
                uid: message.uid,
                subject,
                from: fromAddress,
                date,
                body: typeof body === "string" ? body : "",
            };
        } catch (error) {
            logger.error("Error parsing message:", error);
            return null;
        }
    }

    private async processEmail(email: EmailMessage, client: ImapFlow): Promise<void> {
        try {
            logger.info(`Processing email from: ${email.from}, subject: ${email.subject}`);

            const vendor = await this.matchVendorByEmail(email.from);
            if (!vendor) {
                logger.info(`No vendor found for email: ${email.from}, skipping`);
                await this.markAsRead(client, email.uid);
                return;
            }

            const rfp = await this.matchRFPBySubject(email.subject, vendor.id);
            if (!rfp) {
                logger.info(`No matching RFP found for subject: ${email.subject}, skipping`);
                await this.markAsRead(client, email.uid);
                return;
            }

            const existingProposal = await prisma.proposal.findFirst({
                where: {
                    rfpId: rfp.id,
                    vendorId: vendor.id,
                }
            });

            if (existingProposal) {
                logger.info(`Proposal already exists from ${vendor.name} for RFP ${rfp.title}, skipping`);
                await this.markAsRead(client, email.uid);
                return;
            }
            const proposalService = Container.get(ProposalService);
            await proposalService.create({
                rfpId: rfp.id,
                vendorId: vendor.id,
                rawContent: email.body,
                emailSubject: email.subject,
            });

            logger.info(`Proposal created from email: vendor=${vendor.name}, rfp=${rfp.title}`);
            await this.markAsRead(client, email.uid);

        } catch (error) {
            logger.error("Error processing email:", error);
        }
    }

    private async matchVendorByEmail(email: string): Promise<{ id: string; name: string } | null> {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { email: email.toLowerCase() },
                select: { id: true, name: true }
            });
            return vendor;
        } catch (error) {
            logger.error("Error matching vendor:", error);
            return null;
        }
    }

    private async matchRFPBySubject(subject: string, vendorId: string): Promise<{ id: string; title: string } | null> {
        try {
            const cleanSubject = subject
                .replace(/^(Re|Fwd|RE|FWD|Fw|FW):\s*/gi, "")
                .trim();

            const rfpIdMatch = cleanSubject.match(/RFP[-_]?([a-zA-Z0-9-]+)/i);
            if (rfpIdMatch) {
                const rfpId = rfpIdMatch[1];
                const rfp = await prisma.rFP.findUnique({
                    where: { id: rfpId },
                    select: { id: true, title: true }
                });
                if (rfp) return rfp;
            }

            const sentRFPs = await prisma.rFP.findMany({
                where: {
                    status: "sent"
                },
                select: { id: true, title: true },
                orderBy: { updatedAt: "desc" }
            });

            for (const rfp of sentRFPs) {
                if (cleanSubject.toLowerCase().includes(rfp.title.toLowerCase()) ||
                    rfp.title.toLowerCase().includes(cleanSubject.toLowerCase())) {
                    return rfp;
                }
            }

            if (sentRFPs.length === 1) {
                return sentRFPs[0];
            }

            return null;
        } catch (error) {
            logger.error("Error matching RFP:", error);
            return null;
        }
    }

    private async markAsRead(client: ImapFlow, uid: number): Promise<void> {
        try {
            await client.messageFlagsAdd({ uid }, ["\\Seen"], { uid: true });
        } catch (error) {
            logger.error("Error marking email as read:", error);
        }
    }
}
