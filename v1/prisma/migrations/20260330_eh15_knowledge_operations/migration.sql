ALTER TABLE "AssistantKnowledgeDocument"
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "disabledReason" TEXT,
ADD COLUMN "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN "lastReviewedById" TEXT;

CREATE TABLE "AssistantKnowledgeDocumentRevision" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "ingestionRunId" TEXT,
  "createdById" TEXT,
  "revisionHash" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "sourceType" "AssistantSourceType" NOT NULL,
  "governanceState" "AssistantSourceGovernanceState" NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isDisabled" BOOLEAN NOT NULL DEFAULT false,
  "disabledReason" TEXT,
  "href" TEXT,
  "featureDomain" TEXT,
  "routeScope" TEXT,
  "roleScope" "Role"[] DEFAULT ARRAY[]::"Role"[],
  "contentHash" TEXT NOT NULL,
  "chunkCount" INTEGER NOT NULL,
  "chunkSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AssistantKnowledgeDocumentRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssistantKnowledgeDocument_isDisabled_isPinned_idx"
ON "AssistantKnowledgeDocument"("isDisabled", "isPinned");

CREATE UNIQUE INDEX "AssistantKnowledgeDocumentRevision_documentId_revisionHash_key"
ON "AssistantKnowledgeDocumentRevision"("documentId", "revisionHash");

CREATE INDEX "AssistantKnowledgeDocumentRevision_documentId_createdAt_idx"
ON "AssistantKnowledgeDocumentRevision"("documentId", "createdAt" DESC);

CREATE INDEX "AssistantKnowledgeDocumentRevision_ingestionRunId_idx"
ON "AssistantKnowledgeDocumentRevision"("ingestionRunId");

ALTER TABLE "AssistantKnowledgeDocument"
ADD CONSTRAINT "AssistantKnowledgeDocument_lastReviewedById_fkey"
FOREIGN KEY ("lastReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssistantKnowledgeDocumentRevision"
ADD CONSTRAINT "AssistantKnowledgeDocumentRevision_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "AssistantKnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssistantKnowledgeDocumentRevision"
ADD CONSTRAINT "AssistantKnowledgeDocumentRevision_ingestionRunId_fkey"
FOREIGN KEY ("ingestionRunId") REFERENCES "AssistantIngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssistantKnowledgeDocumentRevision"
ADD CONSTRAINT "AssistantKnowledgeDocumentRevision_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
