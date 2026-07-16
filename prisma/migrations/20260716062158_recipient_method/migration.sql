-- CreateEnum
CREATE TYPE "ExchangeRecipientMethod" AS ENUM ('ACCOUNT_DETAILS', 'ALIPAY_QR');

-- AlterEnum
BEGIN;
CREATE TYPE "ExchangePaymentMethod_new" AS ENUM ('MOMO', 'CARD');
ALTER TABLE "ExchangeTransaction" ALTER COLUMN "paymentMethod" TYPE "ExchangePaymentMethod_new" USING ("paymentMethod"::text::"ExchangePaymentMethod_new");
ALTER TYPE "ExchangePaymentMethod" RENAME TO "ExchangePaymentMethod_old";
ALTER TYPE "ExchangePaymentMethod_new" RENAME TO "ExchangePaymentMethod";
DROP TYPE "public"."ExchangePaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "ExchangeTransaction" ADD COLUMN     "recipientMethod" "ExchangeRecipientMethod" NOT NULL DEFAULT 'ACCOUNT_DETAILS',
ALTER COLUMN "recipientDetails" DROP NOT NULL;

