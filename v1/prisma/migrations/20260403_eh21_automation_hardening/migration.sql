ALTER TYPE "AutomationApprovalStatus" ADD VALUE IF NOT EXISTS 'INVALIDATED';

ALTER TYPE "AutomationExecutionStatus" ADD VALUE IF NOT EXISTS 'INVALIDATED';
ALTER TYPE "AutomationExecutionStatus" ADD VALUE IF NOT EXISTS 'DEAD_LETTERED';

CREATE TYPE "AutomationFailureCategory" AS ENUM (
  'DELIVERY',
  'VALIDATION',
  'TARGET_STATE',
  'SUPERVISOR',
  'INTERNAL'
);

ALTER TABLE "AutomationRun"
ADD COLUMN "leaseOwner" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastRetriedAt" TIMESTAMP(3),
ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
ADD COLUMN "deadLetterReason" TEXT;

CREATE INDEX "AutomationRun_status_leaseExpiresAt_idx"
ON "AutomationRun"("status", "leaseExpiresAt");

CREATE INDEX "AutomationRun_deadLetteredAt_startedAt_idx"
ON "AutomationRun"("deadLetteredAt", "startedAt" DESC);

ALTER TABLE "AutomationApprovalRequest"
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastRetriedAt" TIMESTAMP(3),
ADD COLUMN "invalidatedAt" TIMESTAMP(3),
ADD COLUMN "invalidatedReason" TEXT,
ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
ADD COLUMN "deadLetterReason" TEXT;

CREATE INDEX "AutomationApprovalRequest_deadLetteredAt_requestedAt_idx"
ON "AutomationApprovalRequest"("deadLetteredAt", "requestedAt" DESC);

ALTER TABLE "AutomationExecutionLog"
ADD COLUMN "failureCategory" "AutomationFailureCategory",
ADD COLUMN "latencyMs" INTEGER;
