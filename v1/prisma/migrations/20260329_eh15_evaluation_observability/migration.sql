CREATE TYPE "AssistantInteractionSource" AS ENUM ('USER_CHAT', 'EVALUATION');

CREATE TYPE "AssistantDisposition" AS ENUM ('ALLOWED', 'NARROWED', 'REFUSED', 'ESCALATION_REQUIRED');

CREATE TYPE "AssistantFailureState" AS ENUM (
  'NONE',
  'NO_HITS',
  'LOW_CONFIDENCE',
  'GOVERNANCE_GATED',
  'POLICY_REFUSED',
  'POLICY_ESCALATION',
  'INTERNAL_ERROR'
);

CREATE TYPE "AssistantEvaluationRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TYPE "AssistantEvaluationCategory" AS ENUM (
  'WORKFLOW_ROUTING',
  'POLICY_EXPLANATION',
  'ROLE_BOUNDARY',
  'AMBIGUITY',
  'MULTILINGUAL',
  'SAFETY'
);

CREATE TABLE "AssistantResponseLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "interactionSource" "AssistantInteractionSource" NOT NULL DEFAULT 'USER_CHAT',
  "evaluationCaseKey" TEXT,
  "conversationId" TEXT,
  "query" TEXT NOT NULL,
  "disposition" "AssistantDisposition" NOT NULL,
  "modelUsed" TEXT,
  "fallbackPath" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "refusalReason" TEXT,
  "failureState" "AssistantFailureState" NOT NULL DEFAULT 'NONE',
  "noHits" BOOLEAN NOT NULL DEFAULT false,
  "lowConfidence" BOOLEAN NOT NULL DEFAULT false,
  "retrievalHitCount" INTEGER NOT NULL DEFAULT 0,
  "citedHitCount" INTEGER NOT NULL DEFAULT 0,
  "latencyMs" INTEGER NOT NULL,
  "topHitScore" DOUBLE PRECISION,
  "citations" JSONB,
  "relatedModuleHrefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AssistantResponseLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantEvaluationRun" (
  "id" TEXT NOT NULL,
  "triggeredById" TEXT,
  "status" "AssistantEvaluationRunStatus" NOT NULL DEFAULT 'RUNNING',
  "caseCount" INTEGER NOT NULL DEFAULT 0,
  "passedCount" INTEGER NOT NULL DEFAULT 0,
  "averageScore" DOUBLE PRECISION,
  "summary" JSONB,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssistantEvaluationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantEvaluationResult" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "caseKey" TEXT NOT NULL,
  "caseLabel" TEXT NOT NULL,
  "category" "AssistantEvaluationCategory" NOT NULL,
  "role" "Role" NOT NULL,
  "query" TEXT NOT NULL,
  "expectedDisposition" "AssistantDisposition" NOT NULL,
  "actualDisposition" "AssistantDisposition" NOT NULL,
  "passed" BOOLEAN NOT NULL DEFAULT false,
  "score" INTEGER NOT NULL DEFAULT 0,
  "citedHitCount" INTEGER NOT NULL DEFAULT 0,
  "relatedModuleMatch" BOOLEAN NOT NULL DEFAULT false,
  "keywordMatch" BOOLEAN NOT NULL DEFAULT false,
  "failureState" "AssistantFailureState" NOT NULL DEFAULT 'NONE',
  "answerExcerpt" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AssistantEvaluationResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantEvaluationResult_runId_caseKey_key" ON "AssistantEvaluationResult"("runId", "caseKey");
CREATE INDEX "AssistantResponseLog_userId_createdAt_idx" ON "AssistantResponseLog"("userId", "createdAt" DESC);
CREATE INDEX "AssistantResponseLog_interactionSource_createdAt_idx" ON "AssistantResponseLog"("interactionSource", "createdAt" DESC);
CREATE INDEX "AssistantResponseLog_failureState_createdAt_idx" ON "AssistantResponseLog"("failureState", "createdAt" DESC);
CREATE INDEX "AssistantResponseLog_noHits_lowConfidence_createdAt_idx" ON "AssistantResponseLog"("noHits", "lowConfidence", "createdAt" DESC);
CREATE INDEX "AssistantEvaluationRun_status_startedAt_idx" ON "AssistantEvaluationRun"("status", "startedAt" DESC);
CREATE INDEX "AssistantEvaluationResult_runId_passed_idx" ON "AssistantEvaluationResult"("runId", "passed");
CREATE INDEX "AssistantEvaluationResult_category_passed_idx" ON "AssistantEvaluationResult"("category", "passed");

ALTER TABLE "AssistantResponseLog"
ADD CONSTRAINT "AssistantResponseLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssistantEvaluationRun"
ADD CONSTRAINT "AssistantEvaluationRun_triggeredById_fkey"
FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssistantEvaluationResult"
ADD CONSTRAINT "AssistantEvaluationResult_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "AssistantEvaluationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
