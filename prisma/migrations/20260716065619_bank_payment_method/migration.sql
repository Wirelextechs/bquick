-- AlterEnum
BEGIN;
CREATE TYPE "ExchangePaymentMethod_new" AS ENUM ('MOMO', 'BANK');
ALTER TABLE "ExchangeTransaction" ALTER COLUMN "paymentMethod" TYPE "ExchangePaymentMethod_new" USING ("paymentMethod"::text::"ExchangePaymentMethod_new");
ALTER TYPE "ExchangePaymentMethod" RENAME TO "ExchangePaymentMethod_old";
ALTER TYPE "ExchangePaymentMethod_new" RENAME TO "ExchangePaymentMethod";
DROP TYPE "public"."ExchangePaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "ExchangeTransaction" ADD COLUMN     "payerBankAccountName" TEXT,
ADD COLUMN     "payerBankAccountNumber" TEXT,
ADD COLUMN     "payerBankName" TEXT,
ALTER COLUMN "payerMomoName" DROP NOT NULL,
ALTER COLUMN "payerMomoNumber" DROP NOT NULL,
ALTER COLUMN "recipientMethod" SET DEFAULT 'ALIPAY_QR';

