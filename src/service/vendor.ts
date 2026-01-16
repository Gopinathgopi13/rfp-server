import { Logger } from "winston";
import { Inject, Service } from "typedi";
import { PrismaClient, Vendor, VendorCategory } from "@prisma/client";
import { CreateVendorInput, UpdateVendorInput } from "../types";



@Service()
export default class VendorService {
    constructor(
        @Inject("logger") private logger: Logger,
        @Inject("prisma") private prisma: PrismaClient
    ) { }

    async list(page?: number, size?: number, search?: string): Promise<{ vendors: Vendor[]; total: number; totalPages: number }> {
        try {
            const queryOptions: any = {
                where: {
                    name: {
                        contains: search,
                        mode: "insensitive"
                    }
                },
                include: { vendorCategory: true },
                orderBy: { created_at: "desc" }
            };

            const total = await this.prisma.vendor.count({
                where: {
                    name: {
                        contains: search,
                        mode: "insensitive"
                    }
                }
            });

            if (page !== undefined && size !== undefined) {
                queryOptions.skip = (page - 1) * size;
                queryOptions.take = size;
            }


            const vendors = await this.prisma.vendor.findMany(queryOptions);
            return { vendors, total, totalPages: (page && size) ? Math.ceil(total / (size || 10)) : 0 };
        } catch (error) {
            this.logger.error("List vendors error", error);
            throw error;
        }
    }

    async getById(id: string): Promise<Vendor | null> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { id },
                include: { vendorCategory: true }
            });
            return vendor;
        } catch (error) {
            this.logger.error("Get vendor error", error);
            throw error;
        }
    }

    async listCategory(): Promise<VendorCategory[]> {
        try {
            const categories = await this.prisma.vendorCategory.findMany({
                orderBy: { name: "asc" }
            });
            return categories;
        } catch (error) {
            this.logger.error("List categories error", error);
            throw error;
        }
    }

    async create(data: CreateVendorInput): Promise<Vendor> {
        try {
            const existingVendor = await this.prisma.vendor.findUnique({
                where: { email: data.email }
            });
            if (existingVendor) {
                throw new Error("Vendor with this email already exists");
            }

            const vendor = await this.prisma.vendor.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    vendorCategoryId: data.vendorCategoryId
                },
                include: { vendorCategory: true }
            });
            return vendor;
        } catch (error) {
            this.logger.error("Create vendor error", error);
            throw error;
        }
    }

    async update(id: string, data: UpdateVendorInput): Promise<Vendor> {
        try {
            const vendor = await this.prisma.vendor.findUnique({ where: { id } });
            if (!vendor) {
                throw new Error("Vendor not found");
            }

            if (data.email && data.email !== vendor.email) {
                const existingVendor = await this.prisma.vendor.findUnique({
                    where: { email: data.email }
                });
                if (existingVendor) {
                    throw new Error("Vendor with this email already exists");
                }
            }

            const updatedVendor = await this.prisma.vendor.update({
                where: { id },
                data,
                include: { vendorCategory: true }
            });
            return updatedVendor;
        } catch (error) {
            this.logger.error("Update vendor error", error);
            throw error;
        }
    }

    async delete(id: string): Promise<Vendor> {
        try {
            const vendor = await this.prisma.vendor.findUnique({ where: { id } });
            if (!vendor) {
                throw new Error("Vendor not found");
            }

            const deletedVendor = await this.prisma.vendor.delete({
                where: { id }
            });
            return deletedVendor;
        } catch (error) {
            this.logger.error("Delete vendor error", error);
            throw error;
        }
    }
}
