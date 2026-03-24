-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "balanceAfter" DOUBLE PRECISION NOT NULL,
ADD COLUMN "balanceBefore" DOUBLE PRECISION NOT NULL,
ADD COLUMN "receiptNumber" TEXT NOT NULL,
ADD COLUMN "recordedById" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- AddForeignKey
ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_recordedById_fkey"
FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
