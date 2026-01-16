export interface ParsedItem {
    name: string;
    quantity: number;
    specifications: Record<string, any>;
}

export interface ParsedRFPData {
    title: string;
    description: string;
    items: ParsedItem[];
    budget: number | null;
    deliveryDeadline: string | null;
    paymentTerms: string | null;
    warranty: string | null;
    additionalRequirements: string[];
}

export interface CreateRFPRequest {
    rawInput: string;
}

export interface SaveRFPRequest {
    title: string;
    description: string;
    rawInput: string;
    budget?: number;
    deliveryDeadline?: string;
    paymentTerms?: string;
    warranty?: string;
    additionalRequirements?: string[];
    items: ParsedItem[];
}
