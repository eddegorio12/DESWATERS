ALTER TABLE "AssistantKnowledgeChunk"
ADD COLUMN "embedding" JSONB,
ADD COLUMN "embeddingModel" TEXT,
ADD COLUMN "embeddingDimensions" INTEGER,
ADD COLUMN "embeddingContentHash" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'vector'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS vector;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'AssistantKnowledgeChunk'
        AND column_name = 'embeddingVector'
    ) THEN
      ALTER TABLE "AssistantKnowledgeChunk"
      ADD COLUMN "embeddingVector" vector(1536);
    END IF;
  END IF;
END
$$;

CREATE INDEX "AssistantKnowledgeChunk_embeddingUpdatedAt_idx"
ON "AssistantKnowledgeChunk"("embeddingUpdatedAt");
