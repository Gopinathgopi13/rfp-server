import { Service } from "typedi";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedRFPData } from "../types/rfp.types";
import logger from "../loaders/logger";

@Service()
export default class GeminiAIService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    }

    async parseRFPFromNaturalLanguage(userInput: string): Promise<ParsedRFPData> {
        try {
            logger.info("Parsing RFP from natural language input using Gemini");

            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            });

            const systemPrompt = `You are an AI assistant that extracts structured RFP (Request for Proposal) data from natural language input.

Extract the following information and return it as a JSON object:
- title: A brief title for the RFP (max 100 characters)
- description: A summary of the procurement requirements
- items: An array of items, each with:
  - name: Item name
  - quantity: Number of items needed (integer)
  - specifications: An object with key-value pairs for specifications
- budget: Total budget as a number (no currency symbols, null if not specified)
- deliveryDeadline: Delivery deadline in YYYY-MM-DD format (null if not specified)
- paymentTerms: Payment terms like "net 30" (null if not specified)
- warranty: Warranty requirements like "1 year" (null if not specified)
- additionalRequirements: Array of any other requirements mentioned

Always return valid JSON. If information is not provided, use null for optional fields or empty arrays.

User input: ${userInput}`;

            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const content = response.text();

            if (!content) {
                throw new Error("No response from Gemini");
            }

            const parsedData = JSON.parse(content);
            return this.validateAndCleanParsedData(parsedData);
        } catch (error) {
            logger.error("Error parsing RFP with Gemini AI", error);
            throw error;
        }
    }

    private validateAndCleanParsedData(data: any): ParsedRFPData {
        const cleanedData: ParsedRFPData = {
            title: this.cleanString(data.title, 100) || "Untitled RFP",
            description: this.cleanString(data.description) || "",
            items: this.cleanItems(data.items),
            budget: this.cleanNumber(data.budget),
            deliveryDeadline: this.cleanDateString(data.deliveryDeadline),
            paymentTerms: this.cleanString(data.paymentTerms),
            warranty: this.cleanString(data.warranty),
            additionalRequirements: this.cleanStringArray(data.additionalRequirements)
        };

        return cleanedData;
    }

    private cleanString(value: any, maxLength?: number): string | null {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }
        const trimmed = value.trim();
        return maxLength ? trimmed.slice(0, maxLength) : trimmed;
    }

    private cleanNumber(value: any): number | null {
        if (value === null || value === undefined) {
            return null;
        }
        const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : Number(value);
        return isNaN(num) ? null : num;
    }

    private cleanDateString(value: any): string | null {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return null;
            }
            return date.toISOString().split("T")[0];
        }
        return value;
    }

    private cleanItems(items: any): ParsedRFPData["items"] {
        if (!Array.isArray(items)) {
            return [];
        }
        return items
            .filter((item: any) => item && typeof item === "object" && item.name)
            .map((item: any) => ({
                name: String(item.name).trim(),
                quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
                specifications: typeof item.specifications === "object" && item.specifications !== null
                    ? item.specifications
                    : {}
            }));
    }

    private cleanStringArray(value: any): string[] {
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .filter((item: any) => typeof item === "string" && item.trim())
            .map((item: string) => item.trim());
    }
}
