import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting seed...");

    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const categories = ["IT", "Health", "Education", "Finance"];

    const upsertAdmin = prisma.users.upsert({
        where: { email: "admin@example.com" },
        create: {
            name: "Admin",
            email: "admin@example.com",
            password: hashedPassword,
        },
        update: {
            name: "Admin",
            email: "admin@example.com",
            password: hashedPassword,
        },
    });

    const categoryUpserts = categories.map((name) =>
        prisma.vendorCategory.upsert({
            where: { name },
            create: { name },
            update: { name },
        })
    );

    await prisma.$transaction([
        upsertAdmin,
        ...categoryUpserts
    ]);

    console.log("Database seeded successfully");
}

main()
    .catch((e) => {
        console.error("Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });