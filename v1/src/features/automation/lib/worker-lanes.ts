import {
  AutomationWorkerLaneKey,
  AutomationWorkerType,
  type AutomationActionType,
  type Prisma,
} from "@prisma/client";

export type AutomationLaneExecutionMode = "ADVISORY_ONLY" | "APPROVAL_GATED";

export type AutomationWorkerLaneSnapshot = {
  label: string;
  moduleKey: string;
  ownerLabel: string;
  policyVersion: string;
  executionMode: AutomationLaneExecutionMode;
  toolAccess: string[];
  approvalActionTypes: AutomationActionType[];
  summary: string;
};

export type AutomationWorkerLaneConfig = AutomationWorkerLaneSnapshot & {
  key: AutomationWorkerLaneKey;
  workerType: AutomationWorkerType;
  scopeType: string;
};

const automationWorkerLaneRegistry: Record<
  AutomationWorkerLaneKey,
  AutomationWorkerLaneConfig
> = {
  FOLLOW_UP_QUEUE: {
    key: AutomationWorkerLaneKey.FOLLOW_UP_QUEUE,
    workerType: AutomationWorkerType.FOLLOW_UP_TRIAGE,
    scopeType: "FOLLOW_UP_VISIBLE_QUEUE",
    label: "Follow-up queue lane",
    moduleKey: "followUp",
    ownerLabel: "Billing and receivables operations",
    policyVersion: "eh20-follow-up-lane-v1",
    executionMode: "APPROVAL_GATED",
    toolAccess: [
      "FOLLOW_UP_VISIBLE_QUEUE",
      "FOLLOW_UP_TRIAGE_RANKING",
      "TELEGRAM_APPROVAL_REQUEST",
    ],
    approvalActionTypes: [
      "FOLLOW_UP_SEND_REMINDER",
      "FOLLOW_UP_SEND_FINAL_NOTICE",
      "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW",
    ],
    summary:
      "Ranks the current receivables queue, keeps the worker advisory by default, and routes exact approved actions through Telegram approval before DWDS executes anything.",
  },
  EXCEPTION_REVIEW: {
    key: AutomationWorkerLaneKey.EXCEPTION_REVIEW,
    workerType: AutomationWorkerType.EXCEPTION_SUMMARIZATION,
    scopeType: "EXCEPTIONS_VISIBLE_QUEUE",
    label: "Exception review lane",
    moduleKey: "exceptions",
    ownerLabel: "Operations and field coordination",
    policyVersion: "eh20-exception-lane-v1",
    executionMode: "ADVISORY_ONLY",
    toolAccess: [
      "EXCEPTIONS_VISIBLE_QUEUE",
      "EXCEPTION_SUMMARY_RANKING",
      "LINKED_MODULE_NAVIGATION",
    ],
    approvalActionTypes: [],
    summary:
      "Ranks operational alerts and drafts review notes for exceptions staff without dispatching work, changing billing, or mutating service state.",
  },
};

export function getAutomationWorkerLaneConfig(laneKey: AutomationWorkerLaneKey) {
  return automationWorkerLaneRegistry[laneKey];
}

export function getAutomationWorkerLaneSnapshot(
  laneKey: AutomationWorkerLaneKey
): AutomationWorkerLaneSnapshot {
  const lane = getAutomationWorkerLaneConfig(laneKey);

  return {
    label: lane.label,
    moduleKey: lane.moduleKey,
    ownerLabel: lane.ownerLabel,
    policyVersion: lane.policyVersion,
    executionMode: lane.executionMode,
    toolAccess: [...lane.toolAccess],
    approvalActionTypes: [...lane.approvalActionTypes],
    summary: lane.summary,
  };
}

export function createAutomationWorkerLaneSnapshotJson(
  laneKey: AutomationWorkerLaneKey
): Prisma.JsonObject {
  return getAutomationWorkerLaneSnapshot(laneKey) as Prisma.JsonObject;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function parseAutomationWorkerLaneSnapshot(
  value: Prisma.JsonValue | null | undefined,
  laneKey: AutomationWorkerLaneKey
): AutomationWorkerLaneSnapshot {
  const fallback = getAutomationWorkerLaneSnapshot(laneKey);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const snapshot = value as Record<string, unknown>;
  const executionMode =
    snapshot.executionMode === "APPROVAL_GATED" ? "APPROVAL_GATED" : "ADVISORY_ONLY";

  return {
    label: typeof snapshot.label === "string" ? snapshot.label : fallback.label,
    moduleKey: typeof snapshot.moduleKey === "string" ? snapshot.moduleKey : fallback.moduleKey,
    ownerLabel:
      typeof snapshot.ownerLabel === "string" ? snapshot.ownerLabel : fallback.ownerLabel,
    policyVersion:
      typeof snapshot.policyVersion === "string"
        ? snapshot.policyVersion
        : fallback.policyVersion,
    executionMode,
    toolAccess: isStringArray(snapshot.toolAccess) ? snapshot.toolAccess : fallback.toolAccess,
    approvalActionTypes: isStringArray(snapshot.approvalActionTypes)
      ? (snapshot.approvalActionTypes as AutomationActionType[])
      : fallback.approvalActionTypes,
    summary: typeof snapshot.summary === "string" ? snapshot.summary : fallback.summary,
  };
}
