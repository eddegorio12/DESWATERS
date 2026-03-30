import { promises as fs } from "node:fs";
import path from "node:path";

import {
  type AssistantSourceGovernanceState,
  type AssistantSourceType,
  type Role,
} from "@prisma/client";

import type { AdminModule } from "@/features/auth/lib/authorization";

export type SourceType = "memory-bank" | "workflow-guide";

export type AssistantCorpusChunk = {
  chunkIndex: number;
  sectionTitle: string | null;
  body: string;
  summary: string;
  searchText: string;
  keywordTerms: string[];
  roleScope: Role[];
  tokenCount: number;
};

export type AssistantCorpusDocument = {
  sourceKey: string;
  title: string;
  sourcePath: string;
  sourceType: SourceType;
  prismaSourceType: AssistantSourceType;
  governanceState: AssistantSourceGovernanceState;
  href: string | null;
  featureDomain: string | null;
  routeScope: string | null;
  roleScope: Role[];
  keywordTerms: string[];
  chunks: AssistantCorpusChunk[];
};

export type WorkflowGuide = {
  module: AdminModule;
  title: string;
  href: string;
  summary: string;
  keywords: readonly string[];
  roles: readonly Role[];
};

const ASSISTANT_MAX_CHUNK_TOKENS = 180;
const ASSISTANT_CHUNK_OVERLAP_TOKENS = 32;

export const memoryBankFiles = [
  "progress.md",
  "features.md",
  "implementation-plan.md",
  "@architecture.md",
  "@product-requirements-document.md",
  "@tech-stack.md",
] as const;

export const workflowGuides: readonly WorkflowGuide[] = [
  {
    module: "assistant",
    title: "Staff assistant",
    href: "/admin/assistant",
    summary:
      "Use this workspace for role-aware DWDS workflow questions, module routing, and cited internal guidance. Ask with the page name, task, or status when possible so retrieval can match approved guidance faster. This assistant stays read-only and cannot post, approve, reset, or mutate operational records.",
    keywords: ["assistant", "help", "guide", "workflow", "module", "citation", "question"],
    roles: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN", "METER_READER", "BILLING", "CASHIER", "VIEWER"],
  },
  {
    module: "dashboard",
    title: "Admin dashboard",
    href: "/admin/dashboard",
    summary:
      "Use the dashboard to review daily priorities, queue pressure, signed-in role scope, and fast links into the main operational modules. Start here when you need to orient yourself before opening billing, follow-up, readings, routes, or exceptions. The dashboard is the summary surface, not the place to post transactional updates.",
    keywords: ["dashboard", "overview", "daily", "priority", "queue", "home"],
    roles: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN", "METER_READER", "BILLING", "CASHIER", "VIEWER"],
  },
  {
    module: "routeOperations",
    title: "Route operations",
    href: "/admin/routes",
    summary:
      "Use routes for service-zone setup, route ownership, coverage gaps, complaint hotspots, and route-level overdue or collection pressure. This is the right page for assigning meter-reading or bill-distribution responsibility and for checking which route is carrying the heaviest collection or complaint pressure. Review route analytics here before changing field assignments or print-batch scope.",
    keywords: ["route", "zone", "coverage", "complaint", "field", "distribution", "reader"],
    roles: ["SUPER_ADMIN", "ADMIN", "BILLING"],
  },
  {
    module: "customers",
    title: "Customer registry",
    href: "/admin/customers",
    summary:
      "Use customers for account setup, service contact review, account status changes, and customer-level record maintenance. Start here when the issue is about the account holder, contact details, or service status rather than meter hardware or payment posting. Customer changes should stay separate from cashier, billing-cycle, and field-work updates.",
    keywords: ["customer", "account", "contact", "service status", "registry"],
    roles: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN"],
  },
  {
    module: "meters",
    title: "Meter operations",
    href: "/admin/meters",
    summary:
      "Use meters for registration, assignment, holder transfer review, and defect or replacement visibility. Open this page when the work is about the physical meter, active holder linkage, route assignment, or replacement history. Meter maintenance belongs here even when the customer or complaint pages mention the same service point.",
    keywords: ["meter", "assignment", "holder", "transfer", "defective", "replacement"],
    roles: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN"],
  },
  {
    module: "readings",
    title: "Reading operations",
    href: "/admin/readings",
    summary:
      "Use readings for meter-reading entry, pending-review cleanup, approval review, and ready-to-bill intake. Meter readers encode readings here, while admins or billing staff use it to review and approve submissions before billing. If the question is about a reading still waiting for review or deletion of a pending submission, this is the first module to check.",
    keywords: ["reading", "meter reading", "pending review", "approve", "usage"],
    roles: ["SUPER_ADMIN", "ADMIN", "METER_READER", "BILLING"],
  },
  {
    module: "billing",
    title: "Billing controls",
    href: "/admin/billing",
    summary:
      "Use billing for bill generation, cycle governance, unpaid-bill review, print-batch preparation, and distribution tracking. This module is the authority for open versus finalized billing-cycle state, regeneration controls, and print-batch preparation. Use billing when the issue is about bill lifecycle, print status, or distribution progress rather than cashier settlement.",
    keywords: ["billing", "bill", "generate", "cycle", "print batch", "distribution"],
    roles: ["SUPER_ADMIN", "ADMIN", "BILLING"],
  },
  {
    module: "payments",
    title: "Cashier posting",
    href: "/admin/payments",
    summary:
      "Use payments for cashier settlement posting, official receipt printing, and remaining-balance review after settlement. Cashiers post complete or partial settlements here and can print the official receipt from the recorded payment path. Do not use this page to reopen billing cycles or change tariff rules.",
    keywords: ["payment", "cashier", "receipt", "settlement", "post payment"],
    roles: ["SUPER_ADMIN", "ADMIN", "CASHIER"],
  },
  {
    module: "collections",
    title: "Collections reporting",
    href: "/admin/collections",
    summary:
      "Use collections for filtered payment history, receivables visibility, and Manila-day cash collection monitoring. This page is for reporting and review, especially when staff need to compare recent payments with unpaid or overdue exposure. Use collections to analyze performance, not to encode a new payment.",
    keywords: ["collections", "report", "payment history", "receivable", "daily totals"],
    roles: ["SUPER_ADMIN", "ADMIN", "BILLING", "CASHIER", "VIEWER"],
  },
  {
    module: "followUp",
    title: "Receivables follow-up",
    href: "/admin/follow-up",
    summary:
      "Use follow-up for overdue reminder stages, disconnection review, disconnection actions, and reinstatement controls. This is the operational queue for reminder escalation, final notices, service disconnection review, and reinstatement after settlement. If the question is about why an account is overdue or what the next receivables action should be, start here.",
    keywords: ["follow-up", "overdue", "reminder", "disconnection", "reinstatement"],
    roles: ["SUPER_ADMIN", "ADMIN", "BILLING"],
  },
  {
    module: "exceptions",
    title: "Operational exceptions",
    href: "/admin/exceptions",
    summary:
      "Use exceptions to review abnormal readings, mismatch alerts, complaints, work orders, repair history, and field-proof records. This page connects office-side anomaly review with complaint-driven field dispatch and completed repair evidence. Use exceptions when the question is about leaks, field service, work-order progress, or abnormal operational signals.",
    keywords: ["exception", "alert", "complaint", "work order", "repair", "leak", "field proof"],
    roles: ["SUPER_ADMIN", "ADMIN", "BILLING", "CASHIER", "TECHNICIAN"],
  },
  {
    module: "staffAccess",
    title: "Staff access",
    href: "/admin/staff-access",
    summary:
      "Use staff access for SUPER_ADMIN account creation, role changes, activation state, lockout review, and audit trail visibility. This module is limited to internal admin-account governance and should be used for password-reset, role, and activation questions rather than day-to-day utility records. Review the audit trail here before making sensitive account changes.",
    keywords: ["staff", "admin", "role", "lockout", "account", "audit"],
    roles: ["SUPER_ADMIN"],
  },
  {
    module: "systemReadiness",
    title: "System readiness",
    href: "/admin/system-readiness",
    summary:
      "Use system readiness for backup snapshot logs, restore guidance, security visibility, and recovery export checks. This is the place to confirm recovery prerequisites, record monthly snapshot references, and download the current readiness bundle. Use it for production-readiness and recovery questions, not billing or cashier workflow steps.",
    keywords: ["system", "backup", "restore", "recovery", "security"],
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    module: "tariffs",
    title: "Tariff registry",
    href: "/admin/tariffs",
    summary:
      "Use tariffs for effectivity-dated billing rule changes, active tariff visibility, and fee-audit history. This page controls the current billing rule set, including minimum charge, usage tiers, penalties, and reconnection fees. Tariff review belongs here before asking the assistant for bill-estimate logic or billing-rule explanations.",
    keywords: ["tariff", "rate", "billing rule", "effectivity", "fee"],
    roles: ["SUPER_ADMIN", "ADMIN", "BILLING"],
  },
] as const;

function trimSnippet(value: string, limit = 260) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 3).trimEnd()}...`;
}

export function tokenize(value: string) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter(
    (token) => token.length > 1
  );
}

function estimateTokenCount(value: string) {
  return value.match(/\S+/g)?.length ?? 0;
}

function collectOverlapParagraphs(paragraphs: string[]) {
  const overlap: string[] = [];
  let tokenBudget = 0;

  for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
    const paragraph = paragraphs[index];
    const paragraphTokens = estimateTokenCount(paragraph);

    if (overlap.length && tokenBudget + paragraphTokens > ASSISTANT_CHUNK_OVERLAP_TOKENS) {
      break;
    }

    overlap.unshift(paragraph);
    tokenBudget += paragraphTokens;

    if (tokenBudget >= ASSISTANT_CHUNK_OVERLAP_TOKENS) {
      break;
    }
  }

  return overlap;
}

function chunkSectionParagraphs(paragraphs: string[]) {
  const normalizedParagraphs = paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean);

  if (!normalizedParagraphs.length) {
    return [];
  }

  const chunks: string[] = [];
  let currentParagraphs: string[] = [];
  let currentTokens = 0;

  for (const paragraph of normalizedParagraphs) {
    const paragraphTokens = estimateTokenCount(paragraph);

    if (paragraphTokens >= ASSISTANT_MAX_CHUNK_TOKENS) {
      if (currentParagraphs.length) {
        chunks.push(currentParagraphs.join("\n\n"));
        currentParagraphs = [];
        currentTokens = 0;
      }

      const words = paragraph.split(/\s+/);
      let slice: string[] = [];
      let sliceTokens = 0;

      for (const word of words) {
        slice.push(word);
        sliceTokens += 1;

        if (sliceTokens >= ASSISTANT_MAX_CHUNK_TOKENS) {
          chunks.push(slice.join(" "));
          slice = [];
          sliceTokens = 0;
        }
      }

      if (slice.length) {
        currentParagraphs = [slice.join(" ")];
        currentTokens = estimateTokenCount(currentParagraphs[0]);
      }

      continue;
    }

    if (currentParagraphs.length && currentTokens + paragraphTokens > ASSISTANT_MAX_CHUNK_TOKENS) {
      chunks.push(currentParagraphs.join("\n\n"));
      currentParagraphs = [...collectOverlapParagraphs(currentParagraphs), paragraph];
      currentTokens = currentParagraphs.reduce(
        (total, currentParagraph) => total + estimateTokenCount(currentParagraph),
        0
      );
      continue;
    }

    currentParagraphs.push(paragraph);
    currentTokens += paragraphTokens;
  }

  if (currentParagraphs.length) {
    chunks.push(currentParagraphs.join("\n\n"));
  }

  return chunks;
}

function inferFeatureDomain(fileName: string) {
  if (fileName.includes("architecture")) {
    return "architecture";
  }

  if (fileName.includes("tech-stack")) {
    return "platform";
  }

  if (fileName.includes("feature")) {
    return "features";
  }

  if (fileName.includes("progress")) {
    return "roadmap";
  }

  if (fileName.includes("product-requirements")) {
    return "product";
  }

  return "planning";
}

function buildMemoryBankPath(fileName: string) {
  return path.join(process.cwd(), "memory-bank", fileName);
}

function getMemoryBankGovernanceState(fileName: string): AssistantSourceGovernanceState {
  if (fileName === "features.md") {
    return "APPROVED";
  }

  if (fileName === "progress.md") {
    return "DEPRECATED";
  }

  return "DRAFT";
}

function parseMarkdownSections(fileName: string, source: string): AssistantCorpusDocument {
  const lines = source.split(/\r?\n/);
  const rootTitle =
    lines.find((line) => line.startsWith("# "))?.replace(/^# /, "").trim() ??
    fileName.replace(/\.md$/, "");
  const chunks: AssistantCorpusChunk[] = [];
  let currentHeading: string | null = rootTitle;
  let sectionParagraphs: string[] = [];
  let paragraphBuffer: string[] = [];
  let chunkIndex = 0;

  const flush = () => {
    if (paragraphBuffer.length) {
      sectionParagraphs.push(paragraphBuffer.join(" ").replace(/\s+/g, " ").trim());
      paragraphBuffer = [];
    }

    if (!sectionParagraphs.length) {
      return;
    }

    const keywordTerms = tokenize(`${rootTitle} ${currentHeading ?? ""}`).slice(0, 12);

    for (const body of chunkSectionParagraphs(sectionParagraphs)) {
      chunks.push({
        chunkIndex,
        sectionTitle: currentHeading,
        body,
        summary: trimSnippet(body),
        searchText: `${rootTitle} ${currentHeading ?? ""} ${body}`.trim(),
        keywordTerms,
        roleScope: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN", "METER_READER", "BILLING", "CASHIER", "VIEWER"],
        tokenCount: estimateTokenCount(body),
      });

      chunkIndex += 1;
    }

    sectionParagraphs = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.*)$/);

    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1].trim();
      continue;
    }

    const cleaned = line
      .replace(/^\s*[-*]\s+/, "")
      .replace(/^\s*\d+\.\s+/, "")
      .trim();

    if (cleaned) {
      paragraphBuffer.push(cleaned);
    } else if (paragraphBuffer.length) {
      sectionParagraphs.push(paragraphBuffer.join(" ").replace(/\s+/g, " ").trim());
      paragraphBuffer = [];
    }
  }

  flush();

  return {
    sourceKey: `memory-bank:${fileName}`,
    title: rootTitle,
    sourcePath: `memory-bank/${fileName}`,
    sourceType: "memory-bank",
    prismaSourceType: "MEMORY_BANK",
    governanceState: getMemoryBankGovernanceState(fileName),
    href: null,
    featureDomain: inferFeatureDomain(fileName),
    routeScope: null,
    roleScope: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN", "METER_READER", "BILLING", "CASHIER", "VIEWER"],
    keywordTerms: [],
    chunks,
  };
}

async function loadMemoryBankDocuments() {
  const files = await Promise.all(
    memoryBankFiles.map(async (fileName) => {
      const content = await fs.readFile(buildMemoryBankPath(fileName), "utf8");
      return parseMarkdownSections(fileName, content);
    })
  );

  return files;
}

function buildWorkflowDocuments() {
  return workflowGuides.map((guide) => ({
    sourceKey: `workflow:${guide.module}`,
    title: guide.title,
    sourcePath: guide.href,
    sourceType: "workflow-guide" as const,
    prismaSourceType: "WORKFLOW_GUIDE" as const,
    governanceState: "APPROVED" as const,
    href: guide.href,
    featureDomain: guide.module,
    routeScope: guide.module === "routeOperations" ? "route-operations" : null,
    roleScope: [...guide.roles],
    keywordTerms: [...guide.keywords],
    chunks: [
      {
        chunkIndex: 0,
        sectionTitle: guide.title,
        body: guide.summary,
        summary: trimSnippet(guide.summary),
        searchText: `${guide.title} ${guide.summary}`.trim(),
        keywordTerms: [...guide.keywords],
        roleScope: [...guide.roles],
        tokenCount: estimateTokenCount(guide.summary),
      },
    ],
  }));
}

export async function loadAssistantCorpusDocuments() {
  const [memoryDocuments, workflowDocuments] = await Promise.all([
    loadMemoryBankDocuments(),
    Promise.resolve(buildWorkflowDocuments()),
  ]);

  return [...workflowDocuments, ...memoryDocuments];
}
