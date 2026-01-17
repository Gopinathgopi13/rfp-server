import { Service } from "typedi";
import prisma from "../loaders/prisma";
import logger from "../loaders/logger";

interface RFPsByStatus {
    draft: number;
    sent: number;
    closed: number;
}

interface StatsData {
    totalRFPs: number;
    rfpsByStatus: RFPsByStatus;
    totalVendors: number;
    proposalsReceivedThisMonth: number;
    totalBudgetValue: number;
}

interface RFPOverTime {
    month: string;
    count: number;
}

interface StatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

interface TrendsData {
    rfpsOverTime: RFPOverTime[];
    statusDistribution: StatusDistribution[];
}

interface RecentRFP {
    id: string;
    title: string;
    status: string;
    budget: number | null;
    createdAt: Date;
}

interface RecentProposal {
    id: string;
    rfpTitle: string;
    vendorName: string;
    proposedPrice: string | null;
    score: number | null;
    isRecommended: boolean;
    receivedAt: Date;
}

interface RecentData {
    rfps: RecentRFP[];
    proposals: RecentProposal[];
}

interface DashboardData {
    stats: StatsData;
    trends: TrendsData;
    recent: RecentData;
}

@Service()
export default class DashboardService {

    async getStatsData(): Promise<StatsData> {
        try {
            const [
                totalRFPs,
                rfpsByStatusRaw,
                totalVendors,
                proposalsThisMonth,
                budgetSum
            ] = await Promise.all([
                prisma.rFP.count(),
                prisma.rFP.groupBy({
                    by: ['status'],
                    _count: {
                        status: true
                    }
                }),
                prisma.vendor.count(),
                prisma.proposal.count({
                    where: {
                        receivedAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                        }
                    }
                }),
                prisma.rFP.aggregate({
                    _sum: {
                        budget: true
                    }
                })
            ]);
            const rfpsByStatus: RFPsByStatus = {
                draft: 0,
                sent: 0,
                closed: 0
            };

            rfpsByStatusRaw.forEach((item) => {
                rfpsByStatus[item.status] = item._count.status;
            });

            return {
                totalRFPs,
                rfpsByStatus,
                totalVendors,
                proposalsReceivedThisMonth: proposalsThisMonth,
                totalBudgetValue: budgetSum._sum.budget ? Number(budgetSum._sum.budget) : 0
            };
        } catch (error) {
            logger.error("Error fetching stats data", error);
            throw error;
        }
    }

    async getRFPsOverTime(): Promise<RFPOverTime[]> {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const rfps = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
                SELECT
                    TO_CHAR("createdAt", 'YYYY-MM') as month,
                    COUNT(*) as count
                FROM rfps
                WHERE "createdAt" >= ${sixMonthsAgo}
                GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
                ORDER BY month ASC
            `;

            return rfps.map(item => ({
                month: item.month,
                count: Number(item.count)
            }));
        } catch (error) {
            logger.error("Error fetching RFPs over time", error);
            throw error;
        }
    }

    async getStatusDistribution(): Promise<StatusDistribution[]> {
        try {
            const totalCount = await prisma.rFP.count();

            if (totalCount === 0) {
                return [];
            }

            const statusGroups = await prisma.rFP.groupBy({
                by: ['status'],
                _count: {
                    status: true
                }
            });

            return statusGroups.map(item => ({
                status: item.status,
                count: item._count.status,
                percentage: Number(((item._count.status / totalCount) * 100).toFixed(2))
            }));
        } catch (error) {
            logger.error("Error fetching status distribution", error);
            throw error;
        }
    }

    async getTrendsData(): Promise<TrendsData> {
        try {
            const [rfpsOverTime, statusDistribution] = await Promise.all([
                this.getRFPsOverTime(),
                this.getStatusDistribution()
            ]);

            return {
                rfpsOverTime,
                statusDistribution
            };
        } catch (error) {
            logger.error("Error fetching trends data", error);
            throw error;
        }
    }

    async getRecentRFPs(): Promise<RecentRFP[]> {
        try {
            const rfps = await prisma.rFP.findMany({
                select: {
                    id: true,
                    title: true,
                    status: true,
                    budget: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });

            return rfps.map(rfp => ({
                id: rfp.id,
                title: rfp.title,
                status: rfp.status,
                budget: rfp.budget ? Number(rfp.budget) : null,
                createdAt: rfp.createdAt
            }));
        } catch (error) {
            logger.error("Error fetching recent RFPs", error);
            throw error;
        }
    }

    async getRecentProposals(): Promise<RecentProposal[]> {
        try {
            const proposals = await prisma.proposal.findMany({
                select: {
                    id: true,
                    proposedPrice: true,
                    score: true,
                    isRecommended: true,
                    receivedAt: true,
                    rfp: {
                        select: {
                            title: true
                        }
                    },
                    vendor: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    receivedAt: 'desc'
                },
                take: 5
            });

            return proposals.map(proposal => ({
                id: proposal.id,
                rfpTitle: proposal.rfp.title,
                vendorName: proposal.vendor.name,
                proposedPrice: proposal.proposedPrice ? String(proposal.proposedPrice) : null,
                score: proposal.score,
                isRecommended: proposal.isRecommended,
                receivedAt: proposal.receivedAt
            }));
        } catch (error) {
            logger.error("Error fetching recent proposals", error);
            throw error;
        }
    }

    async getRecentData(): Promise<RecentData> {
        try {
            const [rfps, proposals] = await Promise.all([
                this.getRecentRFPs(),
                this.getRecentProposals()
            ]);

            return {
                rfps,
                proposals
            };
        } catch (error) {
            logger.error("Error fetching recent data", error);
            throw error;
        }
    }

    async getDashboardData(): Promise<DashboardData> {
        try {
            const [stats, trends, recent] = await Promise.all([
                this.getStatsData(),
                this.getTrendsData(),
                this.getRecentData()
            ]);

            return {
                stats,
                trends,
                recent
            };
        } catch (error) {
            logger.error("Error fetching dashboard data", error);
            throw error;
        }
    }
}
