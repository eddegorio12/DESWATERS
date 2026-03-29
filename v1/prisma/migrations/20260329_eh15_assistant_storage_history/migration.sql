CREATE TYPE "AssistantSourceType" AS ENUM (
    'MEMORY_BANK',
    'WORKFLOW_GUIDE'
);

CREATE TYPE "AssistantIngestionStatus" AS ENUM (
    'RUNNING',
    'SUCCEEDED',
    'FAILED'
);

CREATE TYPE "AssistantConversationMessageRole" AS ENUM (
    'USER',
    'ASSISTANT'
);

CREATE TABLE "AssistantKnowledgeDocument" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "sourceType" "AssistantSourceType" NOT NULL,
    "href" TEXT,
    "featureDomain" TEXT,
    "routeScope" TEXT,
    "roleScope" "Role"[] DEFAULT ARRAY[]::"Role"[],
    "contentHash" TEXT NOT NULL,
    "lastIngestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantKnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "sectionTitle" TEXT,
    "body" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "keywordTerms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roleScope" "Role"[] DEFAULT ARRAY[]::"Role"[],
    "contentHash" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "embeddingUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantIngestionRun" (
    "id" TEXT NOT NULL,
    "triggeredById" TEXT,
    "status" "AssistantIngestionStatus" NOT NULL DEFAULT 'RUNNING',
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantIngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lastAskedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AssistantConversationMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "queryText" TEXT,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantKnowledgeDocument_sourceKey_key"
ON "AssistantKnowledgeDocument"("sourceKey");

CREATE INDEX "AssistantKnowledgeDocument_sourceType_sourcePath_idx"
ON "AssistantKnowledgeDocument"("sourceType", "sourcePath");

CREATE UNIQUE INDEX "AssistantKnowledgeChunk_documentId_chunkIndex_key"
ON "AssistantKnowledgeChunk"("documentId", "chunkIndex");

CREATE INDEX "AssistantKnowledgeChunk_documentId_chunkIndex_idx"
ON "AssistantKnowledgeChunk"("documentId", "chunkIndex");

CREATE INDEX "AssistantIngestionRun_status_startedAt_idx"
ON "AssistantIngestionRun"("status", "startedAt" DESC);

CREATE INDEX "AssistantConversation_userId_lastAskedAt_idx"
ON "AssistantConversation"("userId", "lastAskedAt" DESC);

CREATE INDEX "AssistantConversationMessage_conversationId_createdAt_idx"
ON "AssistantConversationMessage"("conversationId", "createdAt");

ALTER TABLE "AssistantKnowledgeChunk"
ADD CONSTRAINT "AssistantKnowledgeChunk_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "AssistantKnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssistantIngestionRun"
ADD CONSTRAINT "AssistantIngestionRun_triggeredById_fkey"
FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssistantConversation"
ADD CONSTRAINT "AssistantConversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AssistantConversationMessage"
ADD CONSTRAINT "AssistantConversationMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
