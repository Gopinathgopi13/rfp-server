import { Service } from "typedi";
import Anthropic from "@anthropic-ai/sdk";
import logger from "../loaders/logger";
import { ProposalAnalysis } from "../types/proposal.types";

const PROPOSAL_ANALYSIS_PROMPT = `You are an expert procurement analyst. Analyze this vendor proposal for the given RFP (Request for Proposal).

RFP Details:
{{RFP_DETAILS}}

Vendor Proposal:
{{PROPOSAL_CONTENT}}

Extract and analyze the following information. Return your response as a valid JSON object with these fields:

{
  "proposedPrice": <number or null if not specified>,
  "deliveryDays": <number of days or null if not specified>,
  "warranty": <warranty terms as string or null>,
  "paymentTerms": <payment terms as string or null>,
  "itemPricing": [{"itemName": "item1", "price": 100}, ...] or empty array if not specified,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "score": <0-100 score based on: price competitiveness (40%), delivery timeline (25%), payment terms (20%), quality/warranty (15%)>,
  "recommendation": "<2-3 sentence recommendation summary>"
}

Be objective and thorough in your analysis. Return ONLY the JSON object, no other text.`;

@Service()
export default class ProposalAIService {
    private client: Anthropic;

    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
    }

    async analyzeProposal(
        rfpDetails: {
            title: string;
            description: string | null;
            budget: number | null;
            deliveryDeadline: string | null;
            paymentTerms: string | null;
            warranty: string | null;
            items: { itemName: string; quantity: number; specifications: any }[];
        },
        proposalContent: string
    ): Promise<ProposalAnalysis> {
        try {
            logger.info("Analyzing proposal with AI");

            const rfpSummary = `
Title: ${rfpDetails.title}
Description: ${rfpDetails.description || "N/A"}
Budget: ${rfpDetails.budget ? `₹${rfpDetails.budget}` : "Not specified"}
Delivery Deadline: ${rfpDetails.deliveryDeadline || "Not specified"}
Payment Terms: ${rfpDetails.paymentTerms || "Not specified"}
Warranty Required: ${rfpDetails.warranty || "Not specified"}
Items:
${rfpDetails.items.map((item, i) => `  ${i + 1}. ${item.itemName} - Quantity: ${item.quantity}`).join("\n")}
            `.trim();

            const prompt = PROPOSAL_ANALYSIS_PROMPT
                .replace("{{RFP_DETAILS}}", rfpSummary)
                .replace("{{PROPOSAL_CONTENT}}", proposalContent);

            const response = await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            const content = response.content[0];
            if (content.type !== "text") {
                throw new Error("Unexpected response type from AI");
            }

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Failed to parse AI response as JSON");
            }

            const analysis: ProposalAnalysis = JSON.parse(jsonMatch[0]);

            analysis.score = Math.max(0, Math.min(100, analysis.score || 0));

            return analysis;
        } catch (error) {
            logger.error("Proposal AI analysis error", error);
            throw error;
        }
    }
}
