export interface LoginResponse {
    id: string;
    name: string;
    email: string;
    token: string;
    token_expiry: Date;
}

export interface CreateVendorInput {
    name: string;
    email: string;
    phone?: string;
    vendorCategoryId: string;
}

export interface UpdateVendorInput {
    name?: string;
    email?: string;
    phone?: string;
    vendorCategoryId?: string;
    is_active?: boolean;
}