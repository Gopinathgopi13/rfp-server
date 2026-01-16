-- CreateEnum
CREATE TYPE "RfpStatus" AS ENUM ('draft', 'sent', 'closed');

-- CreateTable
CREATE TABLE "rfps" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rawInput" TEXT NOT NULL,
    "budget" DECIMAL(12,2),
    "deliveryDeadline" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "warranty" TEXT,
    "additionalRequirements" JSONB,
    "status" "RfpStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfpItems" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfpItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rfpItems" ADD CONSTRAINT "rfpItems_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
