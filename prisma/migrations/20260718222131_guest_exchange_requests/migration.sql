-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GUEST';

-- DropForeignKey
ALTER TABLE "ExchangeTransaction" DROP CONSTRAINT "ExchangeTransaction_clientId_fkey";

-- AlterTable
ALTER TABLE "ExchangePaymentSettings" ADD COLUMN     "callNumber" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "ExchangeTransaction" ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "requesterRole" "Role" NOT NULL DEFAULT 'CLIENT',
ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ExchangeTransaction_contactPhone_idx" ON "ExchangeTransaction"("contactPhone");

-- CreateIndex
CREATE INDEX "ExchangeTransaction_payerMomoNumber_idx" ON "ExchangeTransaction"("payerMomoNumber");

-- AddForeignKey
ALTER TABLE "ExchangeTransaction" ADD CONSTRAINT "ExchangeTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

