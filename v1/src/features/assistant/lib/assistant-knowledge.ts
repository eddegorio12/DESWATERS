import { type Role } from "@prisma/client";

import {
  canAccessAdminModule,
  getAccessibleAdminModules,
  roleDisplayName,
  type AdminModule,
} from "@/features/auth/lib/authorization";
import {
  calculateProgressiveCharge,
  formatCurrency,
} from "@/features/billing/lib/billing-calculations";
import { prisma } from "@/lib/prisma";

import { memoryBankFiles } from "./assistant-corpus";
import {
  createOpenRouterChatCompletion,
  getOpenRouterConfig,
} from "./openrouter";
import {
  getAssistantConversationHistory,
  getRelatedModulesFromHits,
  persistAssistantConversation,
  searchAssistantKnowledgeChunks,
  syncAssistantKnowledgeBase,
} from "./assistant-store";

export type AssistantKnowledgeHit = {
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

export type AssistantSearchResponse = {
  query: string;
  answer: string;
  basis: string;
  uncertainty: string | null;
  hits: AssistantKnowledgeHit[];
  relatedModules: { href: string; label: string }[];
  conversationId: string | null;
  modelUsed?: string | null;
};

const moduleLabels: Record<AdminModule, string> = {
  dashboard: "Dashboard",
  assistant: "Assistant",
  staffAccess: "Staff Access",
  systemReadiness: "System",
  routeOperations: "Routes",
  customers: "Customers",
  meters: "Meters",
  exceptions: "Exceptions",
  tariffs: "Tariffs",
  readings: "Readings",
  billing: "Billing",
  billPrint: "Bill Print",
  payments: "Payments",
  collections: "Collections",
  followUp: "Follow-Up",
};

const multilingualAliases: Array<{ pattern: RegExp; expansion: string }> = [
  { pattern: /\bbisaya\b|\bcebuano\b/gi, expansion: "bisaya cebuano local language" },
  { pattern: /\bunsaon\b|\bunsaon nako\b/gi, expansion: "how do i" },
  { pattern: /\basa\b/gi, expansion: "where" },
  { pattern: /\bdiin\b|\baha\b/gi, expansion: "where" },
  { pattern: /\bkwarta\b/gi, expansion: "payment money billing" },
  { pattern: /\bsingil\b/gi, expansion: "bill billing charges" },
  { pattern: /\bmetro\b/gi, expansion: "meter" },
  { pattern: /\breklamo\b/gi, expansion: "complaint issue" },
  { pattern: /\bputol\b|\bputlan\b/gi, expansion: "disconnect disconnection" },
  { pattern: /\btabang\b|\btabangi\b/gi, expansion: "help guide" },
];

function expandAssistantQuery(query: string) {
  let expanded = query;

  for (const alias of multilingualAliases) {
    if (alias.pattern.test(expanded)) {
      expanded = `${expanded} ${alias.expansion}`;
    }
  }

  return expanded.replace(/\s+/g, " ").trim();
}

function looksLikeLanguageSupportQuestion(query: string) {
  return /\b(bisaya|cebuano|tagalog|filipino|english|language|dialect)\b/i.test(query);
}

function looksLikeReplyInBisayaRequest(query: string) {
  return /\b(pag|pa|i)-?\s*binisaya\b|\bbinisaya\b|\bbisaya lang\b|\bcebuano lang\b|\bmaka bisaya ka\b|\bmag bisaya\b/i.test(
    query
  );
}

function extractConsumptionValue(query: string) {
  const match = query.match(/(\d+(?:\.\d+)?)\s*(?:cubic\s*meters?|cu\.?\s*m|cu\.?m|m3|metros? kubiko)/i);
  return match ? Number(match[1]) : null;
}

function looksLikeBillEstimateQuestion(query: string) {
  return /\b(bill|billing|charge|charges|bayran|singil|how much|hm|pila|magkano|nagamit|gamit|usage|consume|consumption)\b/i.test(
    query
  );
}

function buildTariffBreakdown(
  consumption: number,
  tariff: {
    minimumCharge: number;
    minimumUsage: number;
    tiers: Array<{
      minVolume: number;
      maxVolume: number | null;
      ratePerCuM: number;
    }>;
  }
) {
  if (consumption <= tariff.minimumUsage) {
    return `The current tariff charges ${formatCurrency(tariff.minimumCharge)} for up to ${tariff.minimumUsage} cu.m.`;
  }

  const parts = [`Base ${formatCurrency(tariff.minimumCharge)} covers the first ${tariff.minimumUsage} cu.m.`];
  let remaining = consumption;

  for (const tier of tariff.tiers) {
    const tierLowerBound = Math.max(tariff.minimumUsage, tier.minVolume - 1);
    const tierUpperBound = tier.maxVolume ?? Number.POSITIVE_INFINITY;
    const billableUnits = Math.max(0, Math.min(consumption, tierUpperBound) - tierLowerBound);

    if (billableUnits <= 0) {
      continue;
    }

    parts.push(`${billableUnits} cu.m at ${formatCurrency(tier.ratePerCuM)} per cu.m.`);
    remaining -= billableUnits;

    if (remaining <= tariff.minimumUsage) {
      break;
    }
  }

  return parts.join(" ");
}

function extractTaggedSection(value: string, tag: string) {
  const expression = new RegExp(`${tag}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i");
  const match = value.match(expression);
  return match?.[1]?.trim() ?? null;
}

async function synthesizeAssistantAnswer(input: {
  query: string;
  role: Role;
  hits: AssistantKnowledgeHit[];
}) {
  const config = getOpenRouterConfig();

  if (!config.apiKey) {
    return null;
  }

  const contextBlock = input.hits
    .slice(0, 4)
    .map(
      (hit, index) =>
        `Source ${index + 1}\nTitle: ${hit.sectionTitle ?? hit.title}\nType: ${hit.sourceType}\nPath: ${hit.sourcePath}\nSummary: ${hit.summary}`
    )
    .join("\n\n");

  const completion = await createOpenRouterChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "You are the DWDS internal assistant. Answer in plain language for non-technical staff. Use only the provided sources. Do not mention roadmap IDs, enhancement phases, source numbers, or internal planning labels unless the user asked about project planning. Be direct, complete, and practical. If the user asks which page to use, name the page, explain what they can do there, and tell them the next step. Return plain text in exactly this format:\nANSWER: <2 to 4 sentences, direct and complete>\nBASIS: <1 to 2 short sentences explaining what the sources support>\nUNCERTAINTY: <short note or NONE>",
      },
      {
        role: "user",
        content: `Staff role: ${roleDisplayName[input.role]}\nQuestion: ${input.query}\n\nAllowed sources:\n${contextBlock}\n\nWrite a direct answer based only on those sources. If the sources are incomplete, say so briefly in uncertainty.`,
      },
    ],
    temperature: 0.1,
    maxTokens: 320,
  });

  const answer = extractTaggedSection(completion.content, "ANSWER");
  const basis = extractTaggedSection(completion.content, "BASIS");
  const uncertainty = extractTaggedSection(completion.content, "UNCERTAINTY");

  return {
    answer: answer || completion.content.trim(),
    basis: basis || "This answer was synthesized from the retrieved DWDS sources.",
    uncertainty:
      uncertainty && uncertainty.toUpperCase() !== "NONE" ? uncertainty : null,
    modelUsed: completion.model,
  };
}

export function getAssistantStarterPrompts(role: Role) {
  const shared = [
    "Which DWDS module should I use to review overdue accounts?",
    "What does the receivables follow-up workflow mean in DWDS?",
    "Where do I check route complaints and field work orders?",
    "Can I ask in Bisaya?",
  ];

  const roleSpecific: Record<Role, string[]> = {
    SUPER_ADMIN: [
      "How do I manage internal admin access and lockouts?",
      "Where do I review backup readiness and recovery exports?",
    ],
    ADMIN: [
      "What should I check before reopening a billing cycle?",
      "Where do I review system readiness and route pressure?",
    ],
    BILLING: [
      "Where do approved readings move into bill generation?",
      "What module handles disconnection review and reinstatement?",
    ],
    CASHIER: [
      "Where do I post a payment and print an official receipt?",
      "How do collections reporting differ from cashier posting?",
    ],
    METER_READER: [
      "Where do I encode readings and remove my own pending submissions?",
      "How does route ownership affect the reading list I can see?",
    ],
    TECHNICIAN: [
      "Where do I review field complaints and completed repair history?",
      "Which module handles customer updates versus meter replacement history?",
    ],
    VIEWER: [
      "Which DWDS pages remain available to a viewer role?",
      "Where can I check collections and receivables without editing records?",
    ],
  };

  return [...shared, ...roleSpecific[role]].slice(0, 5);
}

export function getAssistantKnowledgeScope(role: Role) {
  const accessibleModules = getAccessibleAdminModules(role).filter((module) => module !== "billPrint");

  return {
    accessibleModules,
    memorySourceCount: memoryBankFiles.length,
    workflowGuideCount: accessibleModules.length,
    roleLabel: roleDisplayName[role],
  };
}

export async function searchAssistantKnowledge({
  query,
  role,
  userId,
  conversationId,
}: {
  query: string;
  role: Role;
  userId: string;
  conversationId?: string | null;
}): Promise<AssistantSearchResponse | null> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  await syncAssistantKnowledgeBase(userId);

  const expandedQuery = expandAssistantQuery(normalizedQuery);
  const queryTokens = expandedQuery.toLowerCase().match(/[a-z0-9]+/g) ?? [];

  if (!queryTokens.length) {
    return {
      query: normalizedQuery,
      answer:
        "Use a few concrete DWDS terms in the question so the assistant can match workflow guidance more reliably.",
      basis:
        "This EH15 slice now searches persisted internal documentation chunks and role-safe workflow guides before composing a cited answer.",
      uncertainty:
        "The search could not identify meaningful query terms from the current text.",
      hits: [],
      relatedModules: [],
      conversationId: null,
    };
  }

  if (looksLikeLanguageSupportQuestion(normalizedQuery)) {
    if (looksLikeReplyInBisayaRequest(normalizedQuery)) {
      const answer =
        "Oo, maka-Bisaya ko. Pwede ka mangutana in Bisaya, Cebuano, Tagalog, o English. Mas maayo kung apilon nimo ang page, task, o status sa DWDS aron mas sakto ang tubag.";
      const createdConversationId = await persistAssistantConversation({
        userId,
        query: normalizedQuery,
        answer,
        citations: [],
        conversationId,
      });

      return {
        query: normalizedQuery,
        answer,
        basis:
          "Sa karon, documentation-first ang assistant. Mao nang mas klaro ang tubag kung naa ang ngalan sa module, workflow, o task bisan Bisaya ang pangutana.",
        uncertainty:
          "Kung very casual o kulang sa context ang pangutana, mas reliable gihapon kung isulti ang exact nga buhatonon sa DWDS.",
        hits: [],
        relatedModules: [],
        conversationId: createdConversationId,
        modelUsed: null,
      };
    }

    const answer =
      "Yes. You can ask in Bisaya, Cebuano, Tagalog, or plain English. Short, simple questions work best right now, especially if you mention the DWDS page, task, or status you need help with.";
    const createdConversationId = await persistAssistantConversation({
      userId,
      query: normalizedQuery,
      answer,
      citations: [],
      conversationId,
    });

    return {
      query: normalizedQuery,
      answer,
      basis:
        "The current assistant is documentation-first, so it works best when the question still mentions the DWDS task, module, or workflow even if you ask in Bisaya or another local language.",
      uncertainty:
        "If the wording is very informal or mixed-language, the assistant may still answer more reliably when you include the page or task name.",
      hits: [],
      relatedModules: [],
      conversationId: createdConversationId,
      modelUsed: null,
    };
  }

  const consumption = extractConsumptionValue(normalizedQuery);

  if (
    consumption !== null &&
    looksLikeBillEstimateQuestion(normalizedQuery)
  ) {
    const now = new Date();
    const activeTariff =
      (await prisma.tariff.findFirst({
        where: {
          effectiveFrom: {
            lte: now,
          },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: {
          effectiveFrom: "desc",
        },
        select: {
          name: true,
          version: true,
          minimumCharge: true,
          minimumUsage: true,
          tiers: {
            orderBy: {
              minVolume: "asc",
            },
            select: {
              minVolume: true,
              maxVolume: true,
              ratePerCuM: true,
            },
          },
        },
      })) ??
      (await prisma.tariff.findFirst({
        orderBy: {
          effectiveFrom: "desc",
        },
        select: {
          name: true,
          version: true,
          minimumCharge: true,
          minimumUsage: true,
          tiers: {
            orderBy: {
              minVolume: "asc",
            },
            select: {
              minVolume: true,
              maxVolume: true,
              ratePerCuM: true,
            },
          },
        },
      }));

    if (activeTariff) {
      const estimatedBill = calculateProgressiveCharge(consumption, activeTariff);
      const hits = await searchAssistantKnowledgeChunks(role, `${expandedQuery} tariff billing`);
      const answer = `For ${consumption} cu.m of usage, the estimated water bill is ${formatCurrency(estimatedBill)} using the current tariff (${activeTariff.name} v${activeTariff.version}).`;
      const createdConversationId = await persistAssistantConversation({
        userId,
        query: normalizedQuery,
        answer,
        citations: hits.slice(0, 3),
        conversationId,
      });

      return {
        query: normalizedQuery,
        answer,
        basis: buildTariffBreakdown(consumption, activeTariff),
        uncertainty:
          "This is an estimate from the currently effective tariff only. Printed bills may still vary if penalties, reconnection fees, prior balances, or other record-specific charges apply.",
        hits,
        relatedModules: getRelatedModulesFromHits(hits),
        conversationId: createdConversationId,
        modelUsed: null,
      };
    }

    const answer =
      "I could not estimate the bill yet because no tariff is currently available in DWDS. Please check the Tariffs page first.";
    const createdConversationId = await persistAssistantConversation({
      userId,
      query: normalizedQuery,
      answer,
      citations: [],
      conversationId,
    });

    return {
      query: normalizedQuery,
      answer,
      basis:
        "Bill estimates depend on the tariff setup, especially the minimum charge, minimum usage, and per-tier rates.",
      uncertainty:
        "Without a saved tariff, the assistant cannot compute a reliable estimate for the requested consumption.",
      hits: [],
      relatedModules: canAccessAdminModule(role, "tariffs")
        ? [{ href: "/admin/tariffs", label: "Tariff registry" }]
        : [],
      conversationId: createdConversationId,
      modelUsed: null,
    };
  }

  const hits = await searchAssistantKnowledgeChunks(role, expandedQuery);

  if (!hits.length) {
    const answer =
      "I could not match that clearly yet. Try asking in simple words and include the DWDS task, status, or page name, for example: 'Asa ko mag record og payment?' or 'Where do I print a receipt?'";
    const createdConversationId = await persistAssistantConversation({
      userId,
      query: normalizedQuery,
      answer,
      citations: [],
      conversationId,
    });

    return {
      query: normalizedQuery,
      answer,
      basis:
        "The current assistant slice searches the persisted memory-bank corpus and curated role-safe workflow guides stored in the DWDS database.",
      uncertainty:
        "This usually means the wording is still too broad, too informal, or missing the DWDS page or workflow name the assistant needs for retrieval.",
      hits: [],
      relatedModules: [],
      conversationId: createdConversationId,
      modelUsed: null,
    };
  }

  const [topHit, secondHit] = hits;
  const synthesized = await synthesizeAssistantAnswer({
    query: normalizedQuery,
    role,
    hits,
  }).catch(() => null);
  const answer = synthesized?.answer ?? topHit.summary;
  const createdConversationId = await persistAssistantConversation({
    userId,
    query: normalizedQuery,
    answer,
    citations: hits.slice(0, 3),
    conversationId,
  });

  return {
    query: normalizedQuery,
    answer,
    basis:
      synthesized?.basis ??
      (secondHit
        ? `The strongest supporting material also points to ${secondHit.sectionTitle ?? secondHit.title.toLowerCase()}.`
        : "The current answer is based on the highest-scoring persisted DWDS source retrieved for this role."),
    uncertainty:
      synthesized?.uncertainty ??
      (hits.length < 2
        ? "Only one strong supporting source matched this question, so treat the guidance as a first pointer and verify in the linked module."
        : null),
    hits,
    relatedModules: getRelatedModulesFromHits(hits),
    conversationId: createdConversationId,
    modelUsed: synthesized?.modelUsed ?? null,
  };
}

export async function getAssistantWorkspaceState(userId: string, conversationId?: string | null) {
  return getAssistantConversationHistory(userId, conversationId);
}

export function getAssistantModuleLabel(module: AdminModule) {
  return moduleLabels[module];
}
