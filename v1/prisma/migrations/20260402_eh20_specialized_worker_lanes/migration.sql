CREATE TYPE "AutomationWorkerLaneKey" AS ENUM ('FOLLOW_UP_QUEUE', 'EXCEPTION_REVIEW');

ALTER TABLE "AutomationRun"
ADD COLUMN "laneKey" "AutomationWorkerLaneKey",
ADD COLUMN "laneSnapshot" JSONB;

UPDATE "AutomationRun"
SET
  "laneKey" = CASE
    WHEN "workerType" = 'FOLLOW_UP_TRIAGE' THEN 'FOLLOW_UP_QUEUE'::"AutomationWorkerLaneKey"
    ELSE 'EXCEPTION_REVIEW'::"AutomationWorkerLaneKey"
  END,
  "laneSnapshot" = CASE
    WHEN "workerType" = 'FOLLOW_UP_TRIAGE' THEN jsonb_build_object(
      'label', 'Follow-up queue lane',
      'moduleKey', 'followUp',
      'ownerLabel', 'Billing and receivables operations',
      'policyVersion', 'eh20-follow-up-lane-v1',
      'executionMode', 'APPROVAL_GATED',
      'toolAccess', jsonb_build_array(
        'FOLLOW_UP_VISIBLE_QUEUE',
        'FOLLOW_UP_TRIAGE_RANKING',
        'TELEGRAM_APPROVAL_REQUEST'
      ),
      'approvalActionTypes', jsonb_build_array(
        'FOLLOW_UP_SEND_REMINDER',
        'FOLLOW_UP_SEND_FINAL_NOTICE',
        'FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW'
      ),
      'summary', 'Ranks the current receivables queue, keeps the worker advisory by default, and routes exact approved actions through Telegram approval before DWDS executes anything.'
    )
    ELSE jsonb_build_object(
      'label', 'Exception review lane',
      'moduleKey', 'exceptions',
      'ownerLabel', 'Operations and field coordination',
      'policyVersion', 'eh20-exception-lane-v1',
      'executionMode', 'ADVISORY_ONLY',
      'toolAccess', jsonb_build_array(
        'EXCEPTIONS_VISIBLE_QUEUE',
        'EXCEPTION_SUMMARY_RANKING',
        'LINKED_MODULE_NAVIGATION'
      ),
      'approvalActionTypes', jsonb_build_array(),
      'summary', 'Ranks operational alerts and drafts review notes for exceptions staff without dispatching work, changing billing, or mutating service state.'
    )
  END;

ALTER TABLE "AutomationRun"
ALTER COLUMN "laneKey" SET NOT NULL;

CREATE INDEX "AutomationRun_laneKey_startedAt_idx" ON "AutomationRun"("laneKey", "startedAt" DESC);
