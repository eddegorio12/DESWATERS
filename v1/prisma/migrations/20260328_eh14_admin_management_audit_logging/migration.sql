CREATE TYPE "AuthAdminManagementEventType" AS ENUM (
    'ADMIN_CREATED',
    'ROLE_CHANGED',
    'ACCOUNT_DEACTIVATED',
    'ACCOUNT_REACTIVATED',
    'LOCKOUT_CLEARED',
    'TEMPORARY_PASSWORD_SET',
    'OWN_PASSWORD_CHANGED'
);

CREATE TABLE "AuthAdminManagementEvent" (
    "id" TEXT NOT NULL,
    "type" "AuthAdminManagementEventType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAdminManagementEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthAdminManagementEvent_actorId_occurredAt_idx"
ON "AuthAdminManagementEvent"("actorId", "occurredAt" DESC);

CREATE INDEX "AuthAdminManagementEvent_targetUserId_occurredAt_idx"
ON "AuthAdminManagementEvent"("targetUserId", "occurredAt" DESC);

CREATE INDEX "AuthAdminManagementEvent_type_occurredAt_idx"
ON "AuthAdminManagementEvent"("type", "occurredAt" DESC);

ALTER TABLE "AuthAdminManagementEvent"
ADD CONSTRAINT "AuthAdminManagementEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuthAdminManagementEvent"
ADD CONSTRAINT "AuthAdminManagementEvent_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
