import { createHash } from "node:crypto";

import {
  Prisma,
  type AssistantSourceGovernanceState,
  type AssistantSourceType,
  type Role,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { loadAssistantCorpusDocuments, tokenize, workflowGuides } from "./assistant-corpus";
import { createOpenRouterEmbeddings, getOpenRouterConfig } from "./openrouter";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildDocumentHash(document: Awaited<ReturnType<typeof loadAssistantCorpusDocuments>>[number]) {
  return hashValue(
    JSON.stringify({
      title: document.title,
      sourcePath: document.sourcePath,
      sourceType: document.sourceType,
      governanceState: document.governanceState,
      href: document.href,
      featureDomain: document.featureDomain,
      routeScope: document.routeScope,
      roleScope: document.roleScope,
      keywordTerms: document.keywordTerms,
      chunks: document.chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        sectionTitle: chunk.sectionTitle,
        body: chunk.body,
        summary: chunk.summary,
        searchText: chunk.searchText,
        keywordTerms: chunk.keywordTerms,
        roleScope: chunk.roleScope,
        tokenCount: chunk.tokenCount,
      })),
    })
  );
}

function buildChunkHash(chunk: {
  chunkIndex: number;
  sectionTitle: string | null;
  body: string;
  summary: string;
  searchText: string;
  keywordTerms: string[];
  roleScope: Role[];
  tokenCount: number;
}) {
  return hashValue(JSON.stringify(chunk));
}

function trimConversationTitle(query: string) {
  const normalized = query.replace(/\s+/g, " ").trim();

  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 77).trimEnd()}...`;
}

function normalizeConversationTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRecentConversationList<
  T extends {
    id: string;
    title: string;
    lastAskedAt: Date;
    _count: { messages: number };
  },
>(conversations: T[], activeConversationId?: string | null) {
  const deduped: T[] = [];
  const seenTitles = new Set<string>();
  const activeConversation = activeConversationId
    ? conversations.find((conversation) => conversation.id === activeConversationId) ?? null
    : null;

  if (activeConversation) {
    deduped.push(activeConversation);
    seenTitles.add(normalizeConversationTitle(activeConversation.title));
  }

  for (const conversation of conversations) {
    if (conversation.id === activeConversationId) {
      continue;
    }

    const normalizedTitle = normalizeConversationTitle(conversation.title);

    if (!normalizedTitle || seenTitles.has(normalizedTitle)) {
      continue;
    }

    deduped.push(conversation);
    seenTitles.add(normalizedTitle);

    if (deduped.length >= 2) {
      break;
    }
  }

  return deduped.slice(0, 2);
}

function buildVectorLiteral(embedding: number[]) {
  return `[${embedding
    .map((value) => {
      if (!Number.isFinite(value)) {
        throw new Error("Embedding vector contained a non-finite value.");
      }

      return Number(value).toString();
    })
    .join(",")}]`;
}

type PendingEmbeddingChunk = {
  id: string;
  body: string;
  contentHash: string;
};

type PrismaSqlClient = Pick<
  typeof prisma,
  "$executeRawUnsafe" | "$queryRawUnsafe"
>;

type AssistantDocumentControlState = {
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  isDisabled: boolean;
  disabledReason: string | null;
};

type KnowledgeOpsSourceStatus = "current" | "changed" | "new" | "removed";

type AssistantKnowledgeOpsSource = {
  documentId: string | null;
  sourceKey: string;
  title: string;
  sourcePath: string;
  sourceType: "memory-bank" | "workflow-guide";
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  isDisabled: boolean;
  disabledReason: string | null;
  status: KnowledgeOpsSourceStatus;
  hasPendingChanges: boolean;
  changeSummary: {
    addedChunks: number;
    removedChunks: number;
    changedChunks: number;
  };
  chunkCount: number;
  currentChunkCount: number;
  lastIngestedAt: Date | null;
  lastReviewedAt: Date | null;
  lastReviewedByName: string | null;
  latestRevisionAt: Date | null;
  revisionCount: number;
  canRollback: boolean;
  latestStoredSummary: string | null;
  currentSourceSummary: string | null;
};

let vectorRuntimeSupport:
  | {
      checked: boolean;
      enabled: boolean;
    }
  | null = null;

async function hasVectorRuntimeSupport() {
  if (vectorRuntimeSupport?.checked) {
    return vectorRuntimeSupport.enabled;
  }

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        hasVectorExtension: boolean;
        hasVectorColumn: boolean;
      }>
    >(`
      SELECT
        EXISTS (
          SELECT 1
          FROM pg_extension
          WHERE extname = 'vector'
        ) AS "hasVectorExtension",
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'AssistantKnowledgeChunk'
            AND column_name = 'embeddingVector'
        ) AS "hasVectorColumn"
    `);

    const enabled = Boolean(rows[0]?.hasVectorExtension && rows[0]?.hasVectorColumn);
    vectorRuntimeSupport = { checked: true, enabled };
    return enabled;
  } catch {
    vectorRuntimeSupport = { checked: true, enabled: false };
    return false;
  }
}

async function updateChunkEmbedding(input: {
  chunkId: string;
  contentHash: string;
  embedding: number[];
  model: string;
  dimensions: number;
}) {
  await prisma.assistantKnowledgeChunk.update({
    where: {
      id: input.chunkId,
    },
    data: {
      embedding: input.embedding as Prisma.InputJsonValue,
      embeddingModel: input.model,
      embeddingDimensions: input.dimensions,
      embeddingContentHash: input.contentHash,
      embeddingUpdatedAt: new Date(),
    },
  });

  if (await hasVectorRuntimeSupport()) {
    const vectorLiteral = buildVectorLiteral(input.embedding);

    await prisma.$executeRawUnsafe(
      `
        UPDATE "AssistantKnowledgeChunk"
        SET
          "embeddingVector" = $1::vector,
          "updatedAt" = NOW()
        WHERE "id" = $2
      `,
      vectorLiteral,
      input.chunkId
    );
  }
}

async function loadAssistantDocumentControlStates(
  client: PrismaSqlClient,
  documentIds: string[]
) {
  if (!documentIds.length) {
    return new Map<string, AssistantDocumentControlState>();
  }

  const rows = await client.$queryRawUnsafe<
    Array<{
      id: string;
      governanceState: AssistantSourceGovernanceState | null;
      isPinned: boolean | null;
      isDisabled: boolean | null;
      disabledReason: string | null;
    }>
  >(
    `
      SELECT
        "id",
        "governanceState"::text AS "governanceState",
        "isPinned",
        "isDisabled",
        "disabledReason"
      FROM "AssistantKnowledgeDocument"
      WHERE "id" = ANY($1)
    `,
    documentIds
  );

  return new Map(
    rows.map((row) => [
      row.id,
      {
        governanceState: row.governanceState ?? "APPROVED",
        isPinned: Boolean(row.isPinned),
        isDisabled: Boolean(row.isDisabled),
        disabledReason: row.disabledReason,
      },
    ])
  );
}

function buildRevisionHash(input: {
  contentHash: string;
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  isDisabled: boolean;
  disabledReason: string | null;
}) {
  return hashValue(JSON.stringify(input));
}

function buildChunkSnapshot(
  chunks: Array<{
    chunkIndex: number;
    sectionTitle: string | null;
    body: string;
    summary: string;
    searchText: string;
    keywordTerms: string[];
    roleScope: Role[];
    tokenCount: number;
    contentHash: string;
  }>
) {
  return chunks.map((chunk) => ({
    chunkIndex: chunk.chunkIndex,
    sectionTitle: chunk.sectionTitle,
    body: chunk.body,
    summary: chunk.summary,
    searchText: chunk.searchText,
    keywordTerms: chunk.keywordTerms,
    roleScope: chunk.roleScope,
    tokenCount: chunk.tokenCount,
    contentHash: chunk.contentHash,
  }));
}

async function createAssistantDocumentRevision(
  tx: Prisma.TransactionClient,
  input: {
    documentId: string;
    ingestionRunId?: string | null;
    createdById?: string | null;
    title: string;
    sourcePath: string;
    sourceType: AssistantSourceType;
    href: string | null;
    featureDomain: string | null;
    routeScope: string | null;
    roleScope: Role[];
    contentHash: string;
    controlState: AssistantDocumentControlState;
    chunks: Array<{
      chunkIndex: number;
      sectionTitle: string | null;
      body: string;
      summary: string;
      searchText: string;
      keywordTerms: string[];
      roleScope: Role[];
      tokenCount: number;
      contentHash: string;
    }>;
  }
) {
  const revisionHash = buildRevisionHash({
    contentHash: input.contentHash,
    governanceState: input.controlState.governanceState,
    isPinned: input.controlState.isPinned,
    isDisabled: input.controlState.isDisabled,
    disabledReason: input.controlState.disabledReason,
  });

  await tx.assistantKnowledgeDocumentRevision.upsert({
    where: {
      documentId_revisionHash: {
        documentId: input.documentId,
        revisionHash,
      },
    },
    update: {},
    create: {
      documentId: input.documentId,
      ingestionRunId: input.ingestionRunId ?? null,
      createdById: input.createdById ?? null,
      revisionHash,
      title: input.title,
      sourcePath: input.sourcePath,
      sourceType: input.sourceType,
      governanceState: input.controlState.governanceState,
      isPinned: input.controlState.isPinned,
      isDisabled: input.controlState.isDisabled,
      disabledReason: input.controlState.disabledReason,
      href: input.href,
      featureDomain: input.featureDomain,
      routeScope: input.routeScope,
      roleScope: input.roleScope,
      contentHash: input.contentHash,
      chunkCount: input.chunks.length,
      chunkSnapshot: buildChunkSnapshot(input.chunks) as Prisma.InputJsonValue,
    },
  });
}

async function refreshChunkEmbeddings(chunks: PendingEmbeddingChunk[]) {
  if (!chunks.length) {
    return 0;
  }

  const config = getOpenRouterConfig();

  if (!config.apiKey || !config.embeddingModel) {
    return 0;
  }

  try {
    const response = await createOpenRouterEmbeddings({
      values: chunks.map((chunk) => chunk.body),
      preferredModel: config.embeddingModel,
      dimensions: config.embeddingDimensions,
      inputType: "document",
    });

    await Promise.all(
      response.embeddings.map((embedding, index) =>
        updateChunkEmbedding({
          chunkId: chunks[index].id,
          contentHash: chunks[index].contentHash,
          embedding,
          model: response.model,
          dimensions: response.dimensions,
        })
      )
    );

    return chunks.length;
  } catch {
    return 0;
  }
}

export async function syncAssistantKnowledgeBase(triggeredById?: string) {
  const documents = await loadAssistantCorpusDocuments();
  const existingDocuments = await prisma.assistantKnowledgeDocument.findMany({
    select: {
      id: true,
      sourceKey: true,
      title: true,
      sourcePath: true,
      sourceType: true,
      href: true,
      featureDomain: true,
      routeScope: true,
      roleScope: true,
      contentHash: true,
      governanceState: true,
      isPinned: true,
      isDisabled: true,
      disabledReason: true,
      chunks: {
        select: {
          id: true,
          chunkIndex: true,
          sectionTitle: true,
          body: true,
          summary: true,
          searchText: true,
          keywordTerms: true,
          roleScope: true,
          tokenCount: true,
          contentHash: true,
          embeddingContentHash: true,
        },
      },
    },
  });

  const existingDocumentMap = new Map(
    existingDocuments.map((document) => [document.sourceKey, document])
  );
  const sourceKeys = documents.map((document) => document.sourceKey);
  const pendingDocuments = documents.map((document) => {
    const existingDocument = existingDocumentMap.get(document.sourceKey);
    const documentHash = buildDocumentHash(document);
    const existingChunkMap = new Map(
      (existingDocument?.chunks ?? []).map((chunk) => [chunk.chunkIndex, chunk])
    );
    const chunkPayload = document.chunks.map((chunk) => {
      const contentHash = buildChunkHash(chunk);
      const existingChunk = existingChunkMap.get(chunk.chunkIndex);

      return {
        ...chunk,
        contentHash,
        needsEmbeddingRefresh:
          !existingChunk || existingChunk.embeddingContentHash !== contentHash,
      };
    });
    const hasChunkDifferences =
      !existingDocument ||
      chunkPayload.length !== (existingDocument?.chunks.length ?? 0) ||
      chunkPayload.some(
        (chunk) => existingChunkMap.get(chunk.chunkIndex)?.contentHash !== chunk.contentHash
      );

    return {
      ...document,
      documentHash,
      existingDocument,
      chunkPayload,
      hasChanges:
        !existingDocument ||
        existingDocument.contentHash !== documentHash ||
        hasChunkDifferences,
    };
  });

  const deletedSourceKeys = existingDocuments
    .filter((document) => !sourceKeys.includes(document.sourceKey))
    .map((document) => document.sourceKey);
  const pendingEmbeddingCount = pendingDocuments.reduce(
    (total, document) =>
      total + document.chunkPayload.filter((chunk) => chunk.needsEmbeddingRefresh).length,
    0
  );

  if (!pendingDocuments.some((document) => document.hasChanges) && !deletedSourceKeys.length && !pendingEmbeddingCount) {
    return {
      sourceCount: existingDocuments.length,
      chunkCount: existingDocuments.reduce((total, document) => total + document.chunks.length, 0),
      embeddedChunkCount: existingDocuments.reduce(
        (total, document) =>
          total + document.chunks.filter((chunk) => chunk.embeddingContentHash).length,
        0
      ),
      skipped: true,
    };
  }

  const run = await prisma.assistantIngestionRun.create({
    data: {
      triggeredById,
      status: "RUNNING",
    },
  });

  try {
    const embeddingQueue: PendingEmbeddingChunk[] = [];
    let chunkCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const document of pendingDocuments) {
        const upserted = await tx.assistantKnowledgeDocument.upsert({
          where: { sourceKey: document.sourceKey },
          update: {
            title: document.title,
            sourcePath: document.sourcePath,
            sourceType: document.prismaSourceType,
            href: document.href,
            featureDomain: document.featureDomain,
            routeScope: document.routeScope,
            roleScope: document.roleScope,
            contentHash: document.documentHash,
            lastIngestedAt: new Date(),
          },
          create: {
            sourceKey: document.sourceKey,
            title: document.title,
            sourcePath: document.sourcePath,
            sourceType: document.prismaSourceType,
            governanceState: document.governanceState,
            href: document.href,
            featureDomain: document.featureDomain,
            routeScope: document.routeScope,
            roleScope: document.roleScope,
            contentHash: document.documentHash,
            lastIngestedAt: new Date(),
          },
          select: {
            id: true,
            governanceState: true,
            isPinned: true,
            isDisabled: true,
            disabledReason: true,
          },
        });
        const controlState = {
          governanceState: upserted.governanceState,
          isPinned: upserted.isPinned,
          isDisabled: upserted.isDisabled,
          disabledReason: upserted.disabledReason,
        } satisfies AssistantDocumentControlState;

        chunkCount += document.chunkPayload.length;
        const chunkIndexes = document.chunkPayload.map((chunk) => chunk.chunkIndex);

        for (const chunk of document.chunkPayload) {
          const persistedChunk = await tx.assistantKnowledgeChunk.upsert({
            where: {
              documentId_chunkIndex: {
                documentId: upserted.id,
                chunkIndex: chunk.chunkIndex,
              },
            },
            update: {
              sectionTitle: chunk.sectionTitle,
              body: chunk.body,
              summary: chunk.summary,
              searchText: chunk.searchText,
              keywordTerms: chunk.keywordTerms,
              roleScope: chunk.roleScope,
              contentHash: chunk.contentHash,
              tokenCount: chunk.tokenCount,
              ...(chunk.needsEmbeddingRefresh
                ? {
                    embeddingUpdatedAt: null,
                    embeddingModel: null,
                    embeddingDimensions: null,
                    embeddingContentHash: null,
                  }
                : {}),
            },
            create: {
              documentId: upserted.id,
              chunkIndex: chunk.chunkIndex,
              sectionTitle: chunk.sectionTitle,
              body: chunk.body,
              summary: chunk.summary,
              searchText: chunk.searchText,
              keywordTerms: chunk.keywordTerms,
              roleScope: chunk.roleScope,
              contentHash: chunk.contentHash,
              tokenCount: chunk.tokenCount,
            },
            select: {
              id: true,
            },
          });

          if (chunk.needsEmbeddingRefresh) {
            embeddingQueue.push({
              id: persistedChunk.id,
              body: chunk.body,
              contentHash: chunk.contentHash,
            });
          }
        }

        await tx.assistantKnowledgeChunk.deleteMany({
          where: {
            documentId: upserted.id,
            chunkIndex: { notIn: chunkIndexes.length ? chunkIndexes : [-1] },
          },
        });

        await createAssistantDocumentRevision(tx, {
          documentId: upserted.id,
          ingestionRunId: run.id,
          createdById: triggeredById ?? null,
          title: document.title,
          sourcePath: document.sourcePath,
          sourceType: document.prismaSourceType,
          href: document.href,
          featureDomain: document.featureDomain,
          routeScope: document.routeScope,
          roleScope: document.roleScope,
          contentHash: document.documentHash,
          controlState,
          chunks: document.chunkPayload.map((chunk) => ({
            chunkIndex: chunk.chunkIndex,
            sectionTitle: chunk.sectionTitle,
            body: chunk.body,
            summary: chunk.summary,
            searchText: chunk.searchText,
            keywordTerms: chunk.keywordTerms,
            roleScope: chunk.roleScope,
            tokenCount: chunk.tokenCount,
            contentHash: chunk.contentHash,
          })),
        });
      }

      for (const deletedSourceKey of deletedSourceKeys) {
        const existingDocument = existingDocumentMap.get(deletedSourceKey);

        if (!existingDocument) {
          continue;
        }

        await createAssistantDocumentRevision(tx, {
          documentId: existingDocument.id,
          ingestionRunId: run.id,
          createdById: triggeredById ?? null,
          title: existingDocument.title,
          sourcePath: existingDocument.sourcePath,
          sourceType: existingDocument.sourceType,
          href: existingDocument.href,
          featureDomain: existingDocument.featureDomain,
          routeScope: existingDocument.routeScope,
          roleScope: existingDocument.roleScope,
          contentHash: existingDocument.contentHash,
          controlState: {
            governanceState: existingDocument.governanceState,
            isPinned: existingDocument.isPinned,
            isDisabled: existingDocument.isDisabled,
            disabledReason: existingDocument.disabledReason,
          },
          chunks: existingDocument.chunks.map((chunk) => ({
            chunkIndex: chunk.chunkIndex,
            sectionTitle: chunk.sectionTitle,
            body: chunk.body,
            summary: chunk.summary,
            searchText: chunk.searchText,
            keywordTerms: chunk.keywordTerms,
            roleScope: chunk.roleScope,
            tokenCount: chunk.tokenCount,
            contentHash: chunk.contentHash,
          })),
        });

        await tx.assistantKnowledgeDocument.update({
          where: {
            id: existingDocument.id,
          },
          data: {
            isDisabled: true,
            disabledReason: "Source removed from the live assistant corpus.",
            lastReviewedAt: new Date(),
            lastReviewedById: triggeredById ?? null,
          },
        });
      }
    });

    const embeddedChunkCount = await refreshChunkEmbeddings(embeddingQueue);

    await prisma.assistantIngestionRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        sourceCount: documents.length,
        chunkCount,
        completedAt: new Date(),
      },
    });

    return { sourceCount: documents.length, chunkCount, embeddedChunkCount, skipped: false };
  } catch (error) {
    await prisma.assistantIngestionRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown assistant ingestion failure.",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

type PersistedChunkHit = {
  id: string;
  title: string;
  summary: string;
  sectionTitle: string | null;
  sourcePath: string;
  sourceType: "memory-bank" | "workflow-guide";
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  isDisabled: boolean;
  href: string | null;
  matchingTerms: string[];
  score: number;
  lexicalScore: number;
  vectorScore: number;
  sourcePriority: number;
  featureDomain: string | null;
  routeScope: string | null;
};

type LexicalChunkCandidate = Omit<PersistedChunkHit, "score" | "vectorScore" | "sourcePriority"> & {
  score: number;
};

function scoreChunk(
  chunk: {
    sectionTitle: string | null;
    searchText: string;
    keywordTerms: string[];
  },
  document: {
    title: string;
    featureDomain: string | null;
    routeScope: string | null;
    sourcePath: string;
  },
  queryTokens: string[],
  normalizedQuery: string
) {
  const titleTokens = tokenize(document.title);
  const sectionTokens = tokenize(chunk.sectionTitle ?? "");
  const bodyTokens = tokenize(chunk.searchText);
  const keywordTokens = chunk.keywordTerms.flatMap((keyword) => tokenize(keyword));
  const domainTokens = tokenize(
    `${document.featureDomain ?? ""} ${document.routeScope ?? ""} ${document.sourcePath}`
  );
  const tokenMatches = queryTokens.filter(
    (token) =>
      titleTokens.includes(token) ||
      sectionTokens.includes(token) ||
      bodyTokens.includes(token) ||
      keywordTokens.includes(token) ||
      domainTokens.includes(token)
  );

  if (!tokenMatches.length) {
    return { score: 0, matchingTerms: [] as string[] };
  }

  let score = tokenMatches.length * 4;
  score += tokenMatches.filter((token) => titleTokens.includes(token)).length * 7;
  score += tokenMatches.filter((token) => sectionTokens.includes(token)).length * 5;
  score += tokenMatches.filter((token) => keywordTokens.includes(token)).length * 4;
  score += tokenMatches.filter((token) => domainTokens.includes(token)).length * 4;

  if (normalizedQuery && chunk.searchText.toLowerCase().includes(normalizedQuery)) {
    score += 14;
  }

  return { score, matchingTerms: [...new Set(tokenMatches)] };
}

function looksLikePlanningQuery(queryTokens: string[]) {
  return queryTokens.some((token) =>
    [
      "plan",
      "planning",
      "roadmap",
      "phase",
      "enhancement",
      "architecture",
      "implementation",
      "progress",
      "backlog",
      "memory",
      "bank",
      "eh15",
      "eh151",
      "eh152",
      "eh153",
      "eh154",
      "eh155",
    ].includes(token)
  );
}

function getSourcePriority(input: {
  sourceType: "memory-bank" | "workflow-guide";
  sourcePath: string;
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  queryTokens: string[];
  title: string;
  featureDomain: string | null;
}) {
  if (input.isPinned) {
    return 48;
  }

  if (input.governanceState === "DEPRECATED") {
    return -24;
  }

  if (input.governanceState === "DRAFT") {
    return looksLikePlanningQuery(input.queryTokens) ? 10 : -8;
  }

  if (input.sourceType === "workflow-guide") {
    return looksLikePlanningQuery(input.queryTokens) ? 18 : 34;
  }

  const sourcePath = input.sourcePath.toLowerCase();

  if (looksLikePlanningQuery(input.queryTokens)) {
    if (sourcePath.includes("implementation-plan")) {
      return 26;
    }

    if (sourcePath.includes("progress")) {
      return 22;
    }

    if (sourcePath.includes("features")) {
      return 20;
    }
  }

  if (sourcePath.includes("@architecture")) {
    return 16;
  }

  if (sourcePath.includes("@product-requirements")) {
    return 14;
  }

  if (sourcePath.includes("@tech-stack")) {
    return 12;
  }

  if (sourcePath.includes("features")) {
    return 10;
  }

  if (sourcePath.includes("implementation-plan")) {
    return 8;
  }

  if (sourcePath.includes("progress")) {
    return 6;
  }

  if (input.featureDomain && tokenize(input.featureDomain).some((token) => input.queryTokens.includes(token))) {
    return 12;
  }

  if (tokenize(input.title).some((token) => input.queryTokens.includes(token))) {
    return 10;
  }

  return 8;
}

function rerankChunkCandidate(
  candidate: PersistedChunkHit,
  input: {
    queryTokens: string[];
    normalizedQuery: string;
  }
) {
  let score = candidate.lexicalScore * 1.25;
  score += candidate.vectorScore * 28;
  score += candidate.sourcePriority;

  const titleTokens = tokenize(candidate.title);
  const sectionTokens = tokenize(candidate.sectionTitle ?? "");
  const pathTokens = tokenize(
    `${candidate.sourcePath} ${candidate.featureDomain ?? ""} ${candidate.routeScope ?? ""}`
  );

  if (titleTokens.some((token) => input.queryTokens.includes(token))) {
    score += 6;
  }

  if (sectionTokens.some((token) => input.queryTokens.includes(token))) {
    score += 5;
  }

  if (pathTokens.some((token) => input.queryTokens.includes(token))) {
    score += 4;
  }

  if (
    candidate.sourceType === "memory-bank" &&
    !looksLikePlanningQuery(input.queryTokens) &&
    /progress|implementation-plan/i.test(candidate.sourcePath)
  ) {
    score -= 10;
  }

  if (
    candidate.sourceType === "workflow-guide" &&
    candidate.href &&
    input.normalizedQuery &&
    candidate.summary.toLowerCase().includes(input.normalizedQuery)
  ) {
    score += 8;
  }

  return score;
}

async function findLexicalChunkCandidates(role: Role, normalizedQuery: string) {
  const queryTokens = tokenize(normalizedQuery);

  if (!queryTokens.length) {
    return [];
  }

  const chunks = await prisma.assistantKnowledgeChunk.findMany({
    where: {
      roleScope: {
        has: role,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          sourcePath: true,
          sourceType: true,
          isPinned: true,
          isDisabled: true,
          href: true,
          featureDomain: true,
          routeScope: true,
        },
      },
    },
  });
  const controlStates = await loadAssistantDocumentControlStates(
    prisma,
    [...new Set(chunks.map((chunk) => chunk.document.id))]
  );

  return chunks
    .map((chunk) => {
      const controlState = controlStates.get(chunk.document.id);

      if (controlState?.isDisabled || chunk.document.isDisabled) {
        return null;
      }

      const { score, matchingTerms } = scoreChunk(
        {
          sectionTitle: chunk.sectionTitle,
          searchText: chunk.searchText,
          keywordTerms: chunk.keywordTerms,
        },
        {
          title: chunk.document.title,
          featureDomain: chunk.document.featureDomain,
          routeScope: chunk.document.routeScope,
          sourcePath: chunk.document.sourcePath,
        },
        queryTokens,
        normalizedQuery
      );

      if (!score) {
        return null;
      }

      return {
        id: chunk.id,
        title: chunk.document.title,
        summary: chunk.summary,
        sectionTitle: chunk.sectionTitle,
        sourcePath: chunk.document.sourcePath,
        sourceType: chunk.document.sourceType === "WORKFLOW_GUIDE" ? "workflow-guide" : "memory-bank",
        governanceState: controlState?.governanceState ?? "APPROVED",
        isPinned: controlState?.isPinned ?? chunk.document.isPinned,
        isDisabled: controlState?.isDisabled ?? chunk.document.isDisabled,
        href: chunk.document.href,
        matchingTerms,
        score,
        lexicalScore: score,
        featureDomain: chunk.document.featureDomain,
        routeScope: chunk.document.routeScope,
      } satisfies LexicalChunkCandidate;
    })
    .filter((hit): hit is LexicalChunkCandidate => Boolean(hit))
    .sort((left, right) => right.score - left.score)
    .slice(0, 18);
}

type VectorSearchRow = {
  id: string;
  title: string;
  summary: string;
  sectionTitle: string | null;
  sourcePath: string;
  sourceType: "MEMORY_BANK" | "WORKFLOW_GUIDE";
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  isDisabled: boolean;
  href: string | null;
  featureDomain: string | null;
  routeScope: string | null;
  vectorScore: number;
};

function parseEmbeddingJson(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return null;
  }

  const embedding = value
    .map((entry) => (typeof entry === "number" ? entry : Number.NaN))
    .filter((entry) => Number.isFinite(entry));

  return embedding.length ? embedding : null;
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length || !left.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function findJsonVectorChunkCandidates(role: Role, queryEmbedding: number[]) {
  const chunks = await prisma.assistantKnowledgeChunk.findMany({
    where: {
      roleScope: {
        has: role,
      },
      embedding: {
        not: Prisma.DbNull,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          sourcePath: true,
          sourceType: true,
          isPinned: true,
          isDisabled: true,
          href: true,
          featureDomain: true,
          routeScope: true,
        },
      },
    },
  });
  const controlStates = await loadAssistantDocumentControlStates(
    prisma,
    [...new Set(chunks.map((chunk) => chunk.document.id))]
  );

  return chunks
    .map((chunk) => {
      const controlState = controlStates.get(chunk.document.id);

      if (controlState?.isDisabled || chunk.document.isDisabled) {
        return null;
      }

      const embedding = parseEmbeddingJson(chunk.embedding);

      if (!embedding) {
        return null;
      }

      const vectorScore = cosineSimilarity(queryEmbedding, embedding);

      if (!Number.isFinite(vectorScore) || vectorScore <= 0) {
        return null;
      }

      return {
        id: chunk.id,
        title: chunk.document.title,
        summary: chunk.summary,
        sectionTitle: chunk.sectionTitle,
        sourcePath: chunk.document.sourcePath,
        sourceType: chunk.document.sourceType,
        governanceState: controlState?.governanceState ?? "APPROVED",
        isPinned: controlState?.isPinned ?? chunk.document.isPinned,
        isDisabled: controlState?.isDisabled ?? chunk.document.isDisabled,
        href: chunk.document.href,
        featureDomain: chunk.document.featureDomain,
        routeScope: chunk.document.routeScope,
        vectorScore,
      } satisfies VectorSearchRow;
    })
    .filter((row): row is VectorSearchRow => Boolean(row))
    .sort((left, right) => (right.vectorScore ?? 0) - (left.vectorScore ?? 0))
    .slice(0, 18);
}

async function findVectorChunkCandidates(role: Role, normalizedQuery: string) {
  const config = getOpenRouterConfig();

  if (!config.apiKey || !config.embeddingModel) {
    return [];
  }

  try {
    const embeddingResponse = await createOpenRouterEmbeddings({
      values: [normalizedQuery],
      preferredModel: config.embeddingModel,
      dimensions: config.embeddingDimensions,
      inputType: "query",
    });
    const queryEmbedding = embeddingResponse.embeddings[0];

    if (!queryEmbedding?.length) {
      return [];
    }

    if (await hasVectorRuntimeSupport()) {
      const vectorLiteral = buildVectorLiteral(queryEmbedding);

      return await prisma.$queryRawUnsafe<VectorSearchRow[]>(
        `
          SELECT
            c."id",
            d."title",
            c."summary",
            c."sectionTitle",
            d."sourcePath",
            d."sourceType",
            d."governanceState",
            d."isPinned",
            d."isDisabled",
            d."href",
            d."featureDomain",
            d."routeScope",
            1 - (c."embeddingVector" <=> $1::vector) AS "vectorScore"
          FROM "AssistantKnowledgeChunk" c
          INNER JOIN "AssistantKnowledgeDocument" d
            ON d."id" = c."documentId"
          WHERE
            $2 = ANY(c."roleScope")
            AND d."isDisabled" = false
            AND c."embeddingVector" IS NOT NULL
          ORDER BY c."embeddingVector" <=> $1::vector
          LIMIT 18
        `,
        vectorLiteral,
        role
      );
    }

    return await findJsonVectorChunkCandidates(role, queryEmbedding);
  } catch {
    return [];
  }
}

export async function searchAssistantKnowledgeChunks(role: Role, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const queryTokens = tokenize(normalizedQuery);

  if (!queryTokens.length) {
    return [];
  }

  const [lexicalCandidates, vectorCandidates] = await Promise.all([
    findLexicalChunkCandidates(role, normalizedQuery),
    findVectorChunkCandidates(role, normalizedQuery),
  ]);
  const candidateMap = new Map<string, PersistedChunkHit>();

  for (const lexicalCandidate of lexicalCandidates) {
    candidateMap.set(lexicalCandidate.id, {
      ...lexicalCandidate,
      vectorScore: 0,
      sourcePriority: 0,
    });
  }

  for (const vectorCandidate of vectorCandidates) {
    const existingCandidate = candidateMap.get(vectorCandidate.id);
    const sourceType =
      vectorCandidate.sourceType === "WORKFLOW_GUIDE" ? "workflow-guide" : "memory-bank";

    if (existingCandidate) {
      existingCandidate.vectorScore = Math.max(existingCandidate.vectorScore, vectorCandidate.vectorScore ?? 0);
      continue;
    }

    candidateMap.set(vectorCandidate.id, {
      id: vectorCandidate.id,
      title: vectorCandidate.title,
      summary: vectorCandidate.summary,
      sectionTitle: vectorCandidate.sectionTitle,
      sourcePath: vectorCandidate.sourcePath,
      sourceType,
      governanceState: vectorCandidate.governanceState,
      isPinned: vectorCandidate.isPinned,
      isDisabled: vectorCandidate.isDisabled,
      href: vectorCandidate.href,
      matchingTerms: [],
      score: 0,
      lexicalScore: 0,
      vectorScore: vectorCandidate.vectorScore ?? 0,
      sourcePriority: 0,
      featureDomain: vectorCandidate.featureDomain,
      routeScope: vectorCandidate.routeScope,
    });
  }

  return [...candidateMap.values()]
    .map((candidate) => {
      candidate.sourcePriority = getSourcePriority({
        sourceType: candidate.sourceType,
        sourcePath: candidate.sourcePath,
        governanceState: candidate.governanceState,
        isPinned: candidate.isPinned,
        queryTokens,
        title: candidate.title,
        featureDomain: candidate.featureDomain,
      });
      candidate.score = rerankChunkCandidate(candidate, {
        queryTokens,
        normalizedQuery,
      });
      return candidate;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function summarizeDocumentPreview(chunks: Array<{ summary: string }>) {
  const preview = chunks.map((chunk) => chunk.summary).find(Boolean) ?? null;
  return preview ? trimConversationTitle(preview) : null;
}

function calculateChunkDiff(
  storedChunks: Array<{ chunkIndex: number; contentHash: string }>,
  currentChunks: Array<{ chunkIndex: number; contentHash: string }>
) {
  const storedByIndex = new Map(storedChunks.map((chunk) => [chunk.chunkIndex, chunk.contentHash]));
  const currentByIndex = new Map(currentChunks.map((chunk) => [chunk.chunkIndex, chunk.contentHash]));
  let addedChunks = 0;
  let removedChunks = 0;
  let changedChunks = 0;

  for (const [chunkIndex, currentHash] of currentByIndex) {
    if (!storedByIndex.has(chunkIndex)) {
      addedChunks += 1;
      continue;
    }

    if (storedByIndex.get(chunkIndex) !== currentHash) {
      changedChunks += 1;
    }
  }

  for (const chunkIndex of storedByIndex.keys()) {
    if (!currentByIndex.has(chunkIndex)) {
      removedChunks += 1;
    }
  }

  return {
    addedChunks,
    removedChunks,
    changedChunks,
  };
}

export async function getAssistantKnowledgeOperationsState() {
  const [currentDocuments, storedDocuments, latestRun] = await Promise.all([
    loadAssistantCorpusDocuments(),
    prisma.assistantKnowledgeDocument.findMany({
      orderBy: [{ isPinned: "desc" }, { sourceType: "asc" }, { title: "asc" }],
      select: {
        id: true,
        sourceKey: true,
        title: true,
        sourcePath: true,
        sourceType: true,
        governanceState: true,
        isPinned: true,
        isDisabled: true,
        disabledReason: true,
        contentHash: true,
        lastIngestedAt: true,
        lastReviewedAt: true,
        lastReviewedBy: {
          select: {
            name: true,
          },
        },
        chunks: {
          orderBy: {
            chunkIndex: "asc",
          },
          select: {
            chunkIndex: true,
            summary: true,
            contentHash: true,
          },
        },
        revisions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 2,
          select: {
            id: true,
            createdAt: true,
            revisionHash: true,
            contentHash: true,
            chunkCount: true,
          },
        },
        _count: {
          select: {
            revisions: true,
          },
        },
      },
    }),
    prisma.assistantIngestionRun.findFirst({
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        sourceCount: true,
        chunkCount: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
      },
    }),
  ]);

  const currentMap = new Map(
    currentDocuments.map((document) => {
      const documentHash = buildDocumentHash(document);

      return [
        document.sourceKey,
        {
          ...document,
          documentHash,
          chunkPayload: document.chunks.map((chunk) => ({
            ...chunk,
            contentHash: buildChunkHash(chunk),
          })),
        },
      ];
    })
  );
  const storedMap = new Map(storedDocuments.map((document) => [document.sourceKey, document]));
  const sourceKeys = [...new Set([...currentMap.keys(), ...storedMap.keys()])].sort();

  const sources = sourceKeys.map((sourceKey) => {
    const currentDocument = currentMap.get(sourceKey);
    const storedDocument = storedMap.get(sourceKey);
    const changeSummary = calculateChunkDiff(
      storedDocument?.chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        contentHash: chunk.contentHash,
      })) ?? [],
      currentDocument?.chunkPayload.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        contentHash: chunk.contentHash,
      })) ?? []
    );
    const status: KnowledgeOpsSourceStatus = !storedDocument
      ? "new"
      : !currentDocument
        ? "removed"
        : storedDocument.contentHash === currentDocument.documentHash
          ? "current"
          : "changed";

    return {
      documentId: storedDocument?.id ?? null,
      sourceKey,
      title: storedDocument?.title ?? currentDocument?.title ?? sourceKey,
      sourcePath: storedDocument?.sourcePath ?? currentDocument?.sourcePath ?? sourceKey,
      sourceType:
        (storedDocument?.sourceType ?? currentDocument?.prismaSourceType) === "WORKFLOW_GUIDE"
          ? "workflow-guide"
          : "memory-bank",
      governanceState: storedDocument?.governanceState ?? currentDocument?.governanceState ?? "APPROVED",
      isPinned: storedDocument?.isPinned ?? false,
      isDisabled: storedDocument?.isDisabled ?? false,
      disabledReason: storedDocument?.disabledReason ?? null,
      status,
      hasPendingChanges: status === "new" || status === "changed" || status === "removed",
      changeSummary,
      chunkCount: storedDocument?.chunks.length ?? 0,
      currentChunkCount: currentDocument?.chunkPayload.length ?? 0,
      lastIngestedAt: storedDocument?.lastIngestedAt ?? null,
      lastReviewedAt: storedDocument?.lastReviewedAt ?? null,
      lastReviewedByName: storedDocument?.lastReviewedBy?.name ?? null,
      latestRevisionAt: storedDocument?.revisions[0]?.createdAt ?? null,
      revisionCount: storedDocument?._count.revisions ?? 0,
      canRollback: Boolean(storedDocument?.revisions[1]),
      latestStoredSummary: summarizeDocumentPreview(storedDocument?.chunks ?? []),
      currentSourceSummary: summarizeDocumentPreview(currentDocument?.chunkPayload ?? []),
    } satisfies AssistantKnowledgeOpsSource;
  });

  return {
    latestRun,
    sources,
    totals: {
      sourceCount: sources.length,
      pendingCount: sources.filter((source) => source.hasPendingChanges).length,
      pinnedCount: sources.filter((source) => source.isPinned).length,
      disabledCount: sources.filter((source) => source.isDisabled).length,
    },
  };
}

export async function updateAssistantKnowledgeDocumentControls(input: {
  documentId: string;
  actorId: string;
  governanceState: AssistantSourceGovernanceState;
  isPinned: boolean;
  isDisabled: boolean;
  disabledReason?: string | null;
}) {
  const document = await prisma.assistantKnowledgeDocument.findUnique({
    where: {
      id: input.documentId,
    },
    select: {
      id: true,
      title: true,
      sourcePath: true,
      sourceType: true,
      href: true,
      featureDomain: true,
      routeScope: true,
      roleScope: true,
      contentHash: true,
      chunks: {
        orderBy: {
          chunkIndex: "asc",
        },
        select: {
          chunkIndex: true,
          sectionTitle: true,
          body: true,
          summary: true,
          searchText: true,
          keywordTerms: true,
          roleScope: true,
          tokenCount: true,
          contentHash: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("The selected assistant knowledge source no longer exists.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.assistantKnowledgeDocument.update({
      where: {
        id: input.documentId,
      },
      data: {
        governanceState: input.governanceState,
        isPinned: input.isPinned,
        isDisabled: input.isDisabled,
        disabledReason:
          input.isDisabled && input.disabledReason?.trim()
            ? input.disabledReason.trim()
            : null,
        lastReviewedAt: new Date(),
        lastReviewedById: input.actorId,
      },
    });

    await createAssistantDocumentRevision(tx, {
      documentId: document.id,
      createdById: input.actorId,
      title: document.title,
      sourcePath: document.sourcePath,
      sourceType: document.sourceType,
      href: document.href,
      featureDomain: document.featureDomain,
      routeScope: document.routeScope,
      roleScope: document.roleScope,
      contentHash: document.contentHash,
      controlState: {
        governanceState: input.governanceState,
        isPinned: input.isPinned,
        isDisabled: input.isDisabled,
        disabledReason:
          input.isDisabled && input.disabledReason?.trim()
            ? input.disabledReason.trim()
            : null,
      },
      chunks: document.chunks,
    });
  });
}

type AssistantRevisionChunkSnapshot = {
  chunkIndex: number;
  sectionTitle: string | null;
  body: string;
  summary: string;
  searchText: string;
  keywordTerms: string[];
  roleScope: Role[];
  tokenCount: number;
  contentHash: string;
};

function parseRevisionChunkSnapshot(value: Prisma.JsonValue): AssistantRevisionChunkSnapshot[] {
  if (!Array.isArray(value)) {
    throw new Error("The selected assistant revision is missing its chunk snapshot.");
  }

  return value.map((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as { chunkIndex?: unknown }).chunkIndex !== "number" ||
      typeof (entry as { body?: unknown }).body !== "string" ||
      typeof (entry as { summary?: unknown }).summary !== "string" ||
      typeof (entry as { searchText?: unknown }).searchText !== "string" ||
      !Array.isArray((entry as { keywordTerms?: unknown }).keywordTerms) ||
      !Array.isArray((entry as { roleScope?: unknown }).roleScope) ||
      typeof (entry as { tokenCount?: unknown }).tokenCount !== "number" ||
      typeof (entry as { contentHash?: unknown }).contentHash !== "string"
    ) {
      throw new Error("The selected assistant revision has an invalid chunk snapshot.");
    }

    return {
      chunkIndex: (entry as { chunkIndex: number }).chunkIndex,
      sectionTitle:
        typeof (entry as { sectionTitle?: unknown }).sectionTitle === "string"
          ? (entry as { sectionTitle: string }).sectionTitle
          : null,
      body: (entry as { body: string }).body,
      summary: (entry as { summary: string }).summary,
      searchText: (entry as { searchText: string }).searchText,
      keywordTerms: (entry as { keywordTerms: string[] }).keywordTerms,
      roleScope: (entry as { roleScope: Role[] }).roleScope,
      tokenCount: (entry as { tokenCount: number }).tokenCount,
      contentHash: (entry as { contentHash: string }).contentHash,
    };
  });
}

export async function rollbackAssistantKnowledgeDocumentToRevision(input: {
  documentId: string;
  actorId: string;
}) {
  const document = await prisma.assistantKnowledgeDocument.findUnique({
    where: {
      id: input.documentId,
    },
    select: {
      id: true,
      title: true,
      sourcePath: true,
      sourceType: true,
      href: true,
      featureDomain: true,
      routeScope: true,
      roleScope: true,
      contentHash: true,
      governanceState: true,
      isPinned: true,
      isDisabled: true,
      disabledReason: true,
      chunks: {
        orderBy: {
          chunkIndex: "asc",
        },
        select: {
          chunkIndex: true,
          sectionTitle: true,
          body: true,
          summary: true,
          searchText: true,
          keywordTerms: true,
          roleScope: true,
          tokenCount: true,
          contentHash: true,
        },
      },
      revisions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 2,
        select: {
          id: true,
          title: true,
          sourcePath: true,
          sourceType: true,
          governanceState: true,
          isPinned: true,
          isDisabled: true,
          disabledReason: true,
          href: true,
          featureDomain: true,
          routeScope: true,
          roleScope: true,
          contentHash: true,
          chunkSnapshot: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("The selected assistant knowledge source no longer exists.");
  }

  const rollbackRevision = document.revisions[1];

  if (!rollbackRevision) {
    throw new Error("No earlier assistant knowledge revision is available for rollback.");
  }

  const chunkSnapshot = parseRevisionChunkSnapshot(rollbackRevision.chunkSnapshot);
  const embeddingQueue: PendingEmbeddingChunk[] = [];

  await prisma.$transaction(async (tx) => {
    await createAssistantDocumentRevision(tx, {
      documentId: document.id,
      createdById: input.actorId,
      title: document.title,
      sourcePath: document.sourcePath,
      sourceType: document.sourceType,
      href: document.href,
      featureDomain: document.featureDomain,
      routeScope: document.routeScope,
      roleScope: document.roleScope,
      contentHash: document.contentHash,
      controlState: {
        governanceState: document.governanceState,
        isPinned: document.isPinned,
        isDisabled: document.isDisabled,
        disabledReason: document.disabledReason,
      },
      chunks: document.chunks,
    });

    await tx.assistantKnowledgeDocument.update({
      where: {
        id: document.id,
      },
      data: {
        title: rollbackRevision.title,
        sourcePath: rollbackRevision.sourcePath,
        sourceType: rollbackRevision.sourceType,
        governanceState: rollbackRevision.governanceState,
        isPinned: rollbackRevision.isPinned,
        isDisabled: rollbackRevision.isDisabled,
        disabledReason: rollbackRevision.disabledReason,
        href: rollbackRevision.href,
        featureDomain: rollbackRevision.featureDomain,
        routeScope: rollbackRevision.routeScope,
        roleScope: rollbackRevision.roleScope,
        contentHash: rollbackRevision.contentHash,
        lastReviewedAt: new Date(),
        lastReviewedById: input.actorId,
        lastIngestedAt: new Date(),
      },
    });

    for (const chunk of chunkSnapshot) {
      const persistedChunk = await tx.assistantKnowledgeChunk.upsert({
        where: {
          documentId_chunkIndex: {
            documentId: document.id,
            chunkIndex: chunk.chunkIndex,
          },
        },
        update: {
          sectionTitle: chunk.sectionTitle,
          body: chunk.body,
          summary: chunk.summary,
          searchText: chunk.searchText,
          keywordTerms: chunk.keywordTerms,
          roleScope: chunk.roleScope,
          tokenCount: chunk.tokenCount,
          contentHash: chunk.contentHash,
          embeddingUpdatedAt: null,
          embeddingModel: null,
          embeddingDimensions: null,
          embeddingContentHash: null,
        },
        create: {
          documentId: document.id,
          chunkIndex: chunk.chunkIndex,
          sectionTitle: chunk.sectionTitle,
          body: chunk.body,
          summary: chunk.summary,
          searchText: chunk.searchText,
          keywordTerms: chunk.keywordTerms,
          roleScope: chunk.roleScope,
          tokenCount: chunk.tokenCount,
          contentHash: chunk.contentHash,
        },
        select: {
          id: true,
        },
      });

      embeddingQueue.push({
        id: persistedChunk.id,
        body: chunk.body,
        contentHash: chunk.contentHash,
      });
    }

    await tx.assistantKnowledgeChunk.deleteMany({
      where: {
        documentId: document.id,
        chunkIndex: {
          notIn: chunkSnapshot.map((chunk) => chunk.chunkIndex),
        },
      },
    });
  });

  await refreshChunkEmbeddings(embeddingQueue);
}

export async function persistAssistantConversation({
  userId,
  query,
  answer,
  citations,
  conversationId,
}: {
  userId: string;
  query: string;
  answer: string;
  citations: Array<{
    id: string;
    title: string;
    sectionTitle: string | null;
    sourcePath: string;
    sourceType: "memory-bank" | "workflow-guide" | "live-record";
    href: string | null;
  }>;
  conversationId?: string | null;
}) {
  const existingConversation = conversationId
    ? await prisma.assistantConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        select: {
          id: true,
        },
      })
    : null;

  const activeConversation =
    existingConversation ??
    (await prisma.assistantConversation.create({
      data: {
        userId,
        title: trimConversationTitle(query),
        lastAskedAt: new Date(),
      },
      select: {
        id: true,
      },
    }));

  const citationPayload = citations.map((citation) => ({
    chunkId: citation.id,
    title: citation.sectionTitle ?? citation.title,
    sourcePath: citation.sourcePath,
    sourceType: citation.sourceType,
    href: citation.href,
  }));

  await prisma.$transaction([
    prisma.assistantConversation.update({
      where: {
        id: activeConversation.id,
      },
      data: {
        lastAskedAt: new Date(),
      },
    }),
    prisma.assistantConversationMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: "USER",
        content: query,
        queryText: query,
      },
    }),
    prisma.assistantConversationMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: "ASSISTANT",
        content: answer,
        queryText: query,
        citations: citationPayload as Prisma.InputJsonValue,
      },
    }),
  ]);

  return activeConversation.id;
}

export async function getAssistantConversationHistory(userId: string, activeConversationId?: string | null) {
  const [recentConversationRows, selectedConversation, conversationCount, latestRun, chunkCount] =
    await Promise.all([
      prisma.assistantConversation.findMany({
        where: { userId },
        orderBy: { lastAskedAt: "desc" },
        take: 18,
        select: {
          id: true,
          title: true,
          lastAskedAt: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      activeConversationId
        ? prisma.assistantConversation.findFirst({
            where: {
              id: activeConversationId,
              userId,
            },
            select: {
              id: true,
              title: true,
              lastAskedAt: true,
              messages: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  role: true,
                  content: true,
                  citations: true,
                  createdAt: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      prisma.assistantConversation.count({
        where: { userId },
      }),
      prisma.assistantIngestionRun.findFirst({
        where: {
          status: "SUCCEEDED",
        },
        orderBy: {
          startedAt: "desc",
        },
        select: {
          startedAt: true,
          completedAt: true,
          sourceCount: true,
          chunkCount: true,
        },
      }),
      prisma.assistantKnowledgeChunk.count(),
    ]);

  return {
    recentConversations: buildRecentConversationList(
      recentConversationRows,
      activeConversationId
    ),
    selectedConversation,
    conversationCount,
    knowledgeBase: {
      latestRun,
      chunkCount,
    },
  };
}

export function getRelatedModulesFromHits(
  hits: Array<{
    href: string | null;
  }>
) {
  return [...new Set(hits.map((hit) => hit.href).filter(Boolean))].map((href) => {
    const matchedGuide = workflowGuides.find((guide) => guide.href === href);

    return {
      href: href!,
      label: matchedGuide?.title ?? "Open module",
    };
  });
}
