-- CreateEnum
CREATE TYPE "ExchangePaymentMethod" AS ENUM ('MOMO', 'CARD', 'ALIPAY');

-- CreateEnum
CREATE TYPE "ExchangeLogAction" AS ENUM ('STATUS_CHANGE', 'NOTE_ADDED');

-- AlterEnum
ALTER TYPE "ExchangeStatus" ADD VALUE 'PROCESSING';

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropIndex
DROP INDEX "ExchangeTransaction_userId_idx";

-- AlterTable
ALTER TABLE "ExchangeTransaction" DROP COLUMN "userId",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "contactPhone" TEXT NOT NULL,
ADD COLUMN     "payerMomoName" TEXT NOT NULL,
ADD COLUMN     "payerMomoNumber" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" "ExchangePaymentMethod" NOT NULL,
ADD COLUMN     "paymentRef" TEXT NOT NULL,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processedById" TEXT,
ADD COLUMN     "processingNote" TEXT,
ADD COLUMN     "proofUrl" TEXT,
ADD COLUMN     "recipientDetails" TEXT NOT NULL,
ADD COLUMN     "referenceCode" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Wallet";

-- CreateTable
CREATE TABLE "ExchangeLog" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "ExchangeLogAction" NOT NULL DEFAULT 'STATUS_CHANGE',
    "fromStatus" "ExchangeStatus",
    "toStatus" "ExchangeStatus",
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "setById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangePaymentSettings" (
    "id" TEXT NOT NULL,
    "momoNumber" TEXT NOT NULL,
    "momoName" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangePaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExchangeLog_exchangeId_idx" ON "ExchangeLog"("exchangeId");

-- CreateIndex
CREATE INDEX "ExchangeRate_createdAt_idx" ON "ExchangeRate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeTransaction_referenceCode_key" ON "ExchangeTransaction"("referenceCode");

-- CreateIndex
CREATE INDEX "ExchangeTransaction_clientId_idx" ON "ExchangeTransaction"("clientId");

-- CreateIndex
CREATE INDEX "ExchangeTransaction_status_idx" ON "ExchangeTransaction"("status");

-- CreateIndex
CREATE INDEX "ExchangeTransaction_referenceCode_idx" ON "ExchangeTransaction"("referenceCode");

-- AddForeignKey
ALTER TABLE "ExchangeTransaction" ADD CONSTRAINT "ExchangeTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeTransaction" ADD CONSTRAINT "ExchangeTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeLog" ADD CONSTRAINT "ExchangeLog_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "ExchangeTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeLog" ADD CONSTRAINT "ExchangeLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangePaymentSettings" ADD CONSTRAINT "ExchangePaymentSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

