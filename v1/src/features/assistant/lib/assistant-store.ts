import { createHash } from "node:crypto";

import {
  Prisma,
  type AssistantSourceGovernanceState,
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

async function setAssistantDocumentGovernanceState(
  client: PrismaSqlClient,
  input: {
    sourceKey: string;
    governanceState: AssistantSourceGovernanceState;
  }
) {
  await client.$executeRawUnsafe(
    `
      UPDATE "AssistantKnowledgeDocument"
      SET
        "governanceState" = $1::"AssistantSourceGovernanceState",
        "updatedAt" = NOW()
      WHERE "sourceKey" = $2
    `,
    input.governanceState,
    input.sourceKey
  );
}

async function loadAssistantDocumentGovernanceStates(
  client: PrismaSqlClient,
  documentIds: string[]
) {
  if (!documentIds.length) {
    return new Map<string, AssistantSourceGovernanceState>();
  }

  const rows = await client.$queryRawUnsafe<
    Array<{
      id: string;
      governanceState: AssistantSourceGovernanceState | null;
    }>
  >(
    `
      SELECT
        "id",
        "governanceState"::text AS "governanceState"
      FROM "AssistantKnowledgeDocument"
      WHERE "id" = ANY($1)
    `,
    documentIds
  );

  return new Map(
    rows.map((row) => [row.id, row.governanceState ?? "APPROVED"])
  );
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
      contentHash: true,
      chunks: {
        select: {
          id: true,
          chunkIndex: true,
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
            href: document.href,
            featureDomain: document.featureDomain,
            routeScope: document.routeScope,
            roleScope: document.roleScope,
            contentHash: document.documentHash,
            lastIngestedAt: new Date(),
          },
          select: { id: true },
        });

        await setAssistantDocumentGovernanceState(tx, {
          sourceKey: document.sourceKey,
          governanceState: document.governanceState,
        });

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
      }

      await tx.assistantKnowledgeDocument.deleteMany({
        where: {
          sourceKey: { notIn: sourceKeys },
        },
      });
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
  queryTokens: string[];
  title: string;
  featureDomain: string | null;
}) {
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
          href: true,
          featureDomain: true,
          routeScope: true,
        },
      },
    },
  });
  const governanceStates = await loadAssistantDocumentGovernanceStates(
    prisma,
    [...new Set(chunks.map((chunk) => chunk.document.id))]
  );

  return chunks
    .map((chunk) => {
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
        governanceState: governanceStates.get(chunk.document.id) ?? "APPROVED",
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
          href: true,
          featureDomain: true,
          routeScope: true,
        },
      },
    },
  });
  const governanceStates = await loadAssistantDocumentGovernanceStates(
    prisma,
    [...new Set(chunks.map((chunk) => chunk.document.id))]
  );

  return chunks
    .map((chunk) => {
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
        governanceState: governanceStates.get(chunk.document.id) ?? "APPROVED",
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
            d."href",
            d."featureDomain",
            d."routeScope",
            1 - (c."embeddingVector" <=> $1::vector) AS "vectorScore"
          FROM "AssistantKnowledgeChunk" c
          INNER JOIN "AssistantKnowledgeDocument" d
            ON d."id" = c."documentId"
          WHERE
            $2 = ANY(c."roleScope")
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
  citations: PersistedChunkHit[];
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
