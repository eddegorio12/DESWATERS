CREATE TABLE "MeterHolderTransfer" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "fromCustomerId" TEXT,
    "toCustomerId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "transferReading" DOUBLE PRECISION,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeterHolderTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MeterHolderTransfer_meterId_effectiveDate_idx" ON "MeterHolderTransfer"("meterId", "effectiveDate" DESC);
CREATE INDEX "MeterHolderTransfer_toCustomerId_idx" ON "MeterHolderTransfer"("toCustomerId");
CREATE INDEX "MeterHolderTransfer_fromCustomerId_idx" ON "MeterHolderTransfer"("fromCustomerId");

ALTER TABLE "MeterHolderTransfer"
ADD CONSTRAINT "MeterHolderTransfer_meterId_fkey"
FOREIGN KEY ("meterId") REFERENCES "Meter"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MeterHolderTransfer"
ADD CONSTRAINT "MeterHolderTransfer_fromCustomerId_fkey"
FOREIGN KEY ("fromCustomerId") REFERENCES "Customer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MeterHolderTransfer"
ADD CONSTRAINT "MeterHolderTransfer_toCustomerId_fkey"
FOREIGN KEY ("toCustomerId") REFERENCES "Customer"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
