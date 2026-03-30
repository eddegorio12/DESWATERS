-- CreateEnum
CREATE TYPE "AutomationWorkerType" AS ENUM ('FOLLOW_UP_TRIAGE');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AutomationProposalDecision" AS ENUM ('KEPT', 'DISMISSED');

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "workerType" "AutomationWorkerType" NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeKey" TEXT,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredById" TEXT NOT NULL,
    "model" TEXT,
    "provider" TEXT,
    "latencyMs" INTEGER,
    "proposalCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationProposal" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendedReviewStep" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidenceLabel" TEXT NOT NULL,
    "sourceMetadata" JSONB,
    "dismissedAt" TIMESTAMP(3),
    "dismissedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationReview" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "decision" "AutomationProposalDecision" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationRun_workerType_startedAt_idx" ON "AutomationRun"("workerType", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "AutomationRun_status_startedAt_idx" ON "AutomationRun"("status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "AutomationRun_triggeredById_startedAt_idx" ON "AutomationRun"("triggeredById", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "AutomationProposal_runId_rank_idx" ON "AutomationProposal"("runId", "rank");

-- CreateIndex
CREATE INDEX "AutomationProposal_targetType_targetId_idx" ON "AutomationProposal"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AutomationProposal_dismissedAt_idx" ON "AutomationProposal"("dismissedAt");

-- CreateIndex
CREATE INDEX "AutomationReview_runId_createdAt_idx" ON "AutomationReview"("runId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AutomationReview_proposalId_createdAt_idx" ON "AutomationReview"("proposalId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AutomationReview_reviewedById_createdAt_idx" ON "AutomationReview"("reviewedById", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationProposal" ADD CONSTRAINT "AutomationProposal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationProposal" ADD CONSTRAINT "AutomationProposal_dismissedById_fkey" FOREIGN KEY ("dismissedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationReview" ADD CONSTRAINT "AutomationReview_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationReview" ADD CONSTRAINT "AutomationReview_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AutomationProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationReview" ADD CONSTRAINT "AutomationReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
