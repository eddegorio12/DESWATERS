CREATE TYPE "AutomationActionType" AS ENUM (
    'FOLLOW_UP_SEND_REMINDER',
    'FOLLOW_UP_SEND_FINAL_NOTICE',
    'FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW',
    'PAYMENT_POST'
);

CREATE TYPE "AutomationApprovalTransport" AS ENUM ('TELEGRAM');

CREATE TYPE "AutomationApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'EXECUTED'
);

CREATE TYPE "AutomationExecutionStatus" AS ENUM (
    'SUCCEEDED',
    'FAILED',
    'REJECTED',
    'EXPIRED',
    'REPLAY_BLOCKED'
);

CREATE TABLE "AutomationActionIntent" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT,
    "workerType" "AutomationWorkerType",
    "actionType" "AutomationActionType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT,
    "payload" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationActionIntent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationApprovalRequest" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "transport" "AutomationApprovalTransport" NOT NULL,
    "status" "AutomationApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "callbackTokenHash" TEXT NOT NULL,
    "transportMessageId" TEXT,
    "deliveryError" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "decidedByLabel" TEXT,
    "lastDeliveredAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationExecutionLog" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "approvalRequestId" TEXT,
    "actionType" "AutomationActionType" NOT NULL,
    "status" "AutomationExecutionStatus" NOT NULL,
    "resultSummary" TEXT NOT NULL,
    "errorMessage" TEXT,
    "resultMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationExecutionLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationApprovalRequest_callbackTokenHash_key" ON "AutomationApprovalRequest"("callbackTokenHash");
CREATE INDEX "AutomationActionIntent_proposalId_createdAt_idx" ON "AutomationActionIntent"("proposalId", "createdAt" DESC);
CREATE INDEX "AutomationActionIntent_actionType_createdAt_idx" ON "AutomationActionIntent"("actionType", "createdAt" DESC);
CREATE INDEX "AutomationActionIntent_targetType_targetId_createdAt_idx" ON "AutomationActionIntent"("targetType", "targetId", "createdAt" DESC);
CREATE INDEX "AutomationActionIntent_createdById_createdAt_idx" ON "AutomationActionIntent"("createdById", "createdAt" DESC);
CREATE INDEX "AutomationApprovalRequest_intentId_createdAt_idx" ON "AutomationApprovalRequest"("intentId", "createdAt" DESC);
CREATE INDEX "AutomationApprovalRequest_status_expiresAt_idx" ON "AutomationApprovalRequest"("status", "expiresAt");
CREATE INDEX "AutomationApprovalRequest_requestedById_createdAt_idx" ON "AutomationApprovalRequest"("requestedById", "createdAt" DESC);
CREATE INDEX "AutomationExecutionLog_intentId_createdAt_idx" ON "AutomationExecutionLog"("intentId", "createdAt" DESC);
CREATE INDEX "AutomationExecutionLog_approvalRequestId_createdAt_idx" ON "AutomationExecutionLog"("approvalRequestId", "createdAt" DESC);
CREATE INDEX "AutomationExecutionLog_status_createdAt_idx" ON "AutomationExecutionLog"("status", "createdAt" DESC);

ALTER TABLE "AutomationActionIntent" ADD CONSTRAINT "AutomationActionIntent_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "AutomationProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AutomationActionIntent" ADD CONSTRAINT "AutomationActionIntent_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AutomationApprovalRequest" ADD CONSTRAINT "AutomationApprovalRequest_intentId_fkey"
FOREIGN KEY ("intentId") REFERENCES "AutomationActionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutomationApprovalRequest" ADD CONSTRAINT "AutomationApprovalRequest_requestedById_fkey"
FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_intentId_fkey"
FOREIGN KEY ("intentId") REFERENCES "AutomationActionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_approvalRequestId_fkey"
FOREIGN KEY ("approvalRequestId") REFERENCES "AutomationApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
