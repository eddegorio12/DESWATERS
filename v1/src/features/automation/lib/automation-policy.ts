export const AUTOMATION_RUN_LEASE_MS = 1000 * 60 * 10;
export const AUTOMATION_APPROVAL_TTL_MS = 1000 * 60 * 30;
export const AUTOMATION_APPROVAL_MAX_RETRY_COUNT = 3;

export function getAutomationRunLeaseExpiry(now = new Date()) {
  return new Date(now.getTime() + AUTOMATION_RUN_LEASE_MS);
}

export function getAutomationApprovalExpiry(now = new Date()) {
  return new Date(now.getTime() + AUTOMATION_APPROVAL_TTL_MS);
}

export function hasDateExpired(value: Date | null | undefined, now = new Date()) {
  return Boolean(value && value.getTime() <= now.getTime());
}
