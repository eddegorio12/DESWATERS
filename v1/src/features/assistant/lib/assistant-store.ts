import { createHash } from "node:crypto";

import { Prisma, type Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { loadAssistantCorpusDocuments, tokenize, workflowGuides } from "./assistant-corpus";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildDocumentHash(document: Awaited<ReturnType<typeof loadAssistantCorpusDocuments>>[number]) {
  return hashValue(
    JSON.stringify({
      title: document.title,
      sourcePath: document.sourcePath,
      sourceType: document.sourceType,
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

export async function syncAssistantKnowledgeBase(triggeredById?: string) {
  const documents = await loadAssistantCorpusDocuments();
  const run = await prisma.assistantIngestionRun.create({
    data: {
      triggeredById,
      status: "RUNNING",
    },
  });

  try {
    const sourceKeys = documents.map((document) => document.sourceKey);
    let chunkCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const document of documents) {
        const documentHash = buildDocumentHash(document);
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
            contentHash: documentHash,
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
            contentHash: documentHash,
            lastIngestedAt: new Date(),
          },
          select: { id: true },
        });

        chunkCount += document.chunks.length;
        const chunkIndexes = document.chunks.map((chunk) => chunk.chunkIndex);

        for (const chunk of document.chunks) {
          await tx.assistantKnowledgeChunk.upsert({
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
              contentHash: buildChunkHash(chunk),
              tokenCount: chunk.tokenCount,
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
              contentHash: buildChunkHash(chunk),
              tokenCount: chunk.tokenCount,
            },
          });
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

      await tx.assistantIngestionRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          sourceCount: documents.length,
          chunkCount,
          completedAt: new Date(),
        },
      });
    });

    return { sourceCount: documents.length, chunkCount };
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
  href: string | null;
  matchingTerms: string[];
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
  },
  queryTokens: string[]
) {
  const titleTokens = tokenize(document.title);
  const sectionTokens = tokenize(chunk.sectionTitle ?? "");
  const bodyTokens = tokenize(chunk.searchText);
  const keywordTokens = chunk.keywordTerms.flatMap((keyword) => tokenize(keyword));
  const tokenMatches = queryTokens.filter(
    (token) =>
      titleTokens.includes(token) ||
      sectionTokens.includes(token) ||
      bodyTokens.includes(token) ||
      keywordTokens.includes(token)
  );

  if (!tokenMatches.length) {
    return { score: 0, matchingTerms: [] as string[] };
  }

  let score = tokenMatches.length * 5;
  score += tokenMatches.filter((token) => titleTokens.includes(token)).length * 6;
  score += tokenMatches.filter((token) => sectionTokens.includes(token)).length * 4;
  score += tokenMatches.filter((token) => keywordTokens.includes(token)).length * 3;

  const exactQuery = queryTokens.join(" ");
  if (exactQuery && chunk.searchText.toLowerCase().includes(exactQuery)) {
    score += 8;
  }

  return { score, matchingTerms: [...new Set(tokenMatches)] };
}

export async function searchAssistantKnowledgeChunks(role: Role, query: string) {
  const queryTokens = tokenize(query);

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
          title: true,
          sourcePath: true,
          sourceType: true,
          href: true,
        },
      },
    },
  });

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
        },
        queryTokens
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
        href: chunk.document.href,
        matchingTerms,
        score,
      } satisfies PersistedChunkHit;
    })
    .filter((hit): hit is PersistedChunkHit => Boolean(hit))
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
  const [recentConversations, selectedConversation, conversationCount, latestRun, chunkCount] =
    await Promise.all([
      prisma.assistantConversation.findMany({
        where: { userId },
        orderBy: { lastAskedAt: "desc" },
        take: 8,
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
    recentConversations,
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
