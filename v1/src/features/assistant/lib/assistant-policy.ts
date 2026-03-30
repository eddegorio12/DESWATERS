import { type Role } from "@prisma/client";

import {
  canAccessAdminModule,
  getAccessibleAdminModules,
} from "@/features/auth/lib/authorization";

import { tokenize, workflowGuides } from "./assistant-corpus";

export type AssistantPolicyDisposition =
  | "allowed"
  | "narrowed"
  | "refused"
  | "escalation-required";

export type AssistantPolicyDecision = {
  disposition: AssistantPolicyDisposition;
  answer?: string;
  basis?: string;
  uncertainty?: string | null;
  allowDraftSources: boolean;
  allowModelSynthesis: boolean;
};

const promptInjectionPatterns = [
  /\bignore (all|any|previous|prior) (instructions|rules|prompts?)\b/i,
  /\b(system|developer) prompt\b/i,
  /\breveal (the )?(prompt|instructions|hidden rules)\b/i,
  /\bjailbreak\b/i,
  /\boverride (your|the) (rules|instructions)\b/i,
];

const secretExfiltrationPatterns = [
  /\b(api[\s-]?key|token|secret|password|passcode|credential|database url|auth secret)\b/i,
  /\b(jwt|session cookie|env(?:ironment)? variables?)\b/i,
  /\bconnection string\b/i,
];

const mutationPatterns = [
  /\b(can you|please|do this|perform|execute|handle)\b.*\b(create|update|delete|remove|reset|clear|unlock|disable|enable|post|send|approve|finalize|reopen|assign|dispatch)\b/i,
  /\b(make|create)\b.*\b(admin|user|bill|payment|notice|work order)\b/i,
  /\b(reset|clear|unlock)\b.*\b(password|lockout|account)\b/i,
];

const liveRecordPatterns = [
  /\b(account number|account no\.?|customer id|meter id|meter number|bill number|receipt number)\b/i,
  /\bshow me\b.*\b(customer|account|bill|payment|balance|overdue)\b/i,
  /\blist\b.*\b(customer|account|bill|payment|balance|overdue)\b/i,
  /\bwho\b.*\b(overdue|disconnected|unpaid)\b/i,
];

const suspiciousSourcePatterns = [
  /\bignore (all|previous|prior) instructions\b/i,
  /\b(system|developer) prompt\b/i,
  /\breveal\b.*\b(secret|password|token|api key)\b/i,
];

function findRestrictedModule(query: string, role: Role) {
  const queryTokens = tokenize(query);

  if (!queryTokens.length) {
    return null;
  }

  return workflowGuides.find((guide) => {
    if (guide.module === "assistant" || guide.module === "dashboard") {
      return false;
    }

    if (canAccessAdminModule(role, guide.module)) {
      return false;
    }

    const guideTokens = tokenize(`${guide.title} ${guide.keywords.join(" ")} ${guide.href}`);
    const overlap = guideTokens.filter((token) => queryTokens.includes(token));
    return overlap.length >= 2;
  });
}

export function containsSuspiciousAssistantSourceContent(value: string) {
  return suspiciousSourcePatterns.some((pattern) => pattern.test(value));
}

export function evaluateAssistantPolicy(input: {
  query: string;
  role: Role;
}): AssistantPolicyDecision {
  const normalizedQuery = input.query.trim();

  if (promptInjectionPatterns.some((pattern) => pattern.test(normalizedQuery))) {
    return {
      disposition: "refused",
      answer:
        "I cannot follow requests to ignore rules, reveal hidden prompts, or treat retrieved text as system instructions.",
      basis:
        "EH15.2 keeps assistant safety behavior server-enforced and does not allow prompt-override requests.",
      uncertainty: null,
      allowDraftSources: false,
      allowModelSynthesis: false,
    };
  }

  if (secretExfiltrationPatterns.some((pattern) => pattern.test(normalizedQuery))) {
    return {
      disposition: "refused",
      answer:
        "I cannot expose passwords, API keys, tokens, environment secrets, or database connection details.",
      basis:
        "The assistant is limited to role-safe workflow guidance and cannot disclose protected credentials or secrets.",
      uncertainty: null,
      allowDraftSources: false,
      allowModelSynthesis: false,
    };
  }

  const restrictedModule = findRestrictedModule(normalizedQuery, input.role);

  if (restrictedModule) {
    return {
      disposition: "narrowed",
      answer: `Your current role does not include ${restrictedModule.title.toLowerCase()} access. I can still help with modules available to you, or an authorized staff member can handle that task directly in ${restrictedModule.title}.`,
      basis:
        "EH15 keeps assistant guidance inside the signed-in user’s current role scope instead of explaining restricted admin workflows as if they were available.",
      uncertainty: null,
      allowDraftSources: false,
      allowModelSynthesis: false,
    };
  }

  if (liveRecordPatterns.some((pattern) => pattern.test(normalizedQuery))) {
    return {
      disposition: "escalation-required",
      answer:
        "I cannot inspect live customer-specific or transaction-specific records in this EH15 slice. Open the relevant DWDS module and review the record there instead.",
      basis:
        "Live-record explainers remain deferred until a later assistant maturity phase, so this assistant stays documentation-first and read-only.",
      uncertainty:
        "If you need a real account, bill, or payment answer, verify it directly in the protected module instead of chat.",
      allowDraftSources: false,
      allowModelSynthesis: false,
    };
  }

  if (mutationPatterns.some((pattern) => pattern.test(normalizedQuery))) {
    return {
      disposition: "escalation-required",
      answer:
        "I can explain where a workflow happens, but I cannot perform actions, approve records, or provide bypass steps through chat.",
      basis:
        "The assistant remains read-only in EH15.2 while governance and refusal behavior are being validated.",
      uncertainty:
        getAccessibleAdminModules(input.role).length > 0
          ? "Use the appropriate protected DWDS page for the actual task."
          : null,
      allowDraftSources: false,
      allowModelSynthesis: false,
    };
  }

  if (/\b(plan|planning|roadmap|phase|enhancement|implementation|progress|eh\d+)\b/i.test(normalizedQuery)) {
    return {
      disposition: "narrowed",
      allowDraftSources: true,
      allowModelSynthesis: false,
      uncertainty:
        "Planning material is not the same as approved operator guidance, so treat any answer here as internal planning context only.",
    };
  }

  return {
    disposition: "allowed",
    allowDraftSources: false,
    allowModelSynthesis: true,
  };
}
