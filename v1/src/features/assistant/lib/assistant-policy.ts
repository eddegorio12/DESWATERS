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

const liveRecordBroadPatterns = [
  /\bshow me\b.*\b(customer|account|bill|payment|balance|overdue)\b/i,
  /\blist\b.*\b(customer|account|bill|payment|balance|overdue)\b/i,
  /\bwho\b.*\b(overdue|disconnected|unpaid)\b/i,
];

const liveRecordIdentifierPatterns = [
  /\b(account number|account no\.?|customer id|meter id|meter number|bill id|bill number|receipt number|route code)\b/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
];

const liveRecordExplanationSignals =
  /\b(why|status|showing|shown|explain|reason|meaning|next step|pressure|severity)\b/i;

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

  if (
    liveRecordBroadPatterns.some((pattern) => pattern.test(normalizedQuery)) ||
    (liveRecordIdentifierPatterns.some((pattern) => pattern.test(normalizedQuery)) &&
      !liveRecordExplanationSignals.test(normalizedQuery))
  ) {
    return {
      disposition: "escalation-required",
      answer:
        "I can only explain one visible DWDS record at a time in EH15.5. Use a specific bill ID, receipt number, route code, meter number, or account number and ask why it shows that status.",
      basis:
        "EH15.5 allows narrow read-only explainers, but broad record lookup and record discovery still remain outside the assistant scope.",
      uncertainty:
        "For bulk review or record discovery, use the protected DWDS module directly instead of chat.",
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
