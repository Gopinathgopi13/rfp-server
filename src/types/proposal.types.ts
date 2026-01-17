export interface ProposalAnalysis {
    proposedPrice: number | null;
    deliveryDays: number | null;
    warranty: string | null;
    paymentTerms: string | null;
    itemPricing: Record<string, number>[];
    strengths: string[];
    weaknesses: string[];
    score: number;
    recommendation: string;
}

export interface CreateProposalInput {
    rfpId: string;
    vendorId: string;
    rawContent: string;
    emailSubject?: string;
}

export interface UpdateProposalInput {
    status?: 'pending' | 'analyzed' | 'accepted' | 'rejected';
    isRecommended?: boolean;
}
