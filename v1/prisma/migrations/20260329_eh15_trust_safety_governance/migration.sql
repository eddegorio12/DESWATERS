CREATE TYPE "AssistantSourceGovernanceState" AS ENUM ('APPROVED', 'DRAFT', 'DEPRECATED');

ALTER TABLE "AssistantKnowledgeDocument"
ADD COLUMN "governanceState" "AssistantSourceGovernanceState" NOT NULL DEFAULT 'APPROVED';
