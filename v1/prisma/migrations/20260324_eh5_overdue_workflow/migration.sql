CREATE TYPE "ReceivableFollowUpStatus" AS ENUM (
  'CURRENT',
  'REMINDER_SENT',
  'FINAL_NOTICE_SENT',
  'DISCONNECTION_REVIEW',
  'DISCONNECTED',
  'RESOLVED'
);

ALTER TABLE "Customer"
ADD COLUMN "statusNote" TEXT,
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN "statusUpdatedById" TEXT;

ALTER TABLE "Bill"
ADD COLUMN "followUpStatus" "ReceivableFollowUpStatus" NOT NULL DEFAULT 'CURRENT',
ADD COLUMN "followUpStatusUpdatedAt" TIMESTAMP(3),
ADD COLUMN "followUpNote" TEXT,
ADD COLUMN "followUpUpdatedById" TEXT;

ALTER TABLE "Customer"
ADD CONSTRAINT "Customer_statusUpdatedById_fkey"
FOREIGN KEY ("statusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Bill"
ADD CONSTRAINT "Bill_followUpUpdatedById_fkey"
FOREIGN KEY ("followUpUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Customer_status_idx" ON "Customer"("status");
CREATE INDEX "Bill_followUpStatus_idx" ON "Bill"("followUpStatus");
