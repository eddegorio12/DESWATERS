CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

CREATE TYPE "NotificationTemplate" AS ENUM (
  'FOLLOW_UP_REMINDER',
  'FINAL_NOTICE',
  'DISCONNECTION',
  'REINSTATEMENT'
);

CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

ALTER TABLE "Customer"
ADD COLUMN "email" TEXT;

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "billId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "template" "NotificationTemplate" NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "triggeredById" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_billId_fkey"
FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_triggeredById_fkey"
FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "NotificationLog_customerId_idx" ON "NotificationLog"("customerId");
CREATE INDEX "NotificationLog_billId_idx" ON "NotificationLog"("billId");
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");
CREATE INDEX "NotificationLog_channel_idx" ON "NotificationLog"("channel");
CREATE INDEX "NotificationLog_template_idx" ON "NotificationLog"("template");
