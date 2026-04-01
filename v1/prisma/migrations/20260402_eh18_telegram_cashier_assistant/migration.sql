CREATE TYPE "TelegramConversationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

CREATE TYPE "TelegramCashierSessionStage" AS ENUM (
  'AWAITING_PAYMENT_DETAILS',
  'AWAITING_BILL_SELECTION',
  'AWAITING_PARTIAL_CONFIRMATION',
  'AWAITING_CASH_CONFIRMATION',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TABLE "TelegramStaffIdentity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "telegramUserId" TEXT NOT NULL,
  "telegramChatId" TEXT,
  "telegramUsername" TEXT,
  "telegramFirstName" TEXT,
  "telegramLastName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TelegramStaffIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramCashierSession" (
  "id" TEXT NOT NULL,
  "staffIdentityId" TEXT NOT NULL,
  "actionType" "AutomationActionType" NOT NULL DEFAULT 'PAYMENT_POST',
  "status" "TelegramConversationStatus" NOT NULL DEFAULT 'ACTIVE',
  "stage" "TelegramCashierSessionStage" NOT NULL DEFAULT 'AWAITING_PAYMENT_DETAILS',
  "parsedIntent" JSONB,
  "lastInboundText" TEXT,
  "lastBotReply" TEXT,
  "approvalRequestId" TEXT,
  "completedPaymentId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TelegramCashierSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramStaffIdentity_userId_key" ON "TelegramStaffIdentity"("userId");
CREATE UNIQUE INDEX "TelegramStaffIdentity_telegramUserId_key" ON "TelegramStaffIdentity"("telegramUserId");
CREATE INDEX "TelegramStaffIdentity_isActive_updatedAt_idx" ON "TelegramStaffIdentity"("isActive", "updatedAt" DESC);

CREATE UNIQUE INDEX "TelegramCashierSession_approvalRequestId_key" ON "TelegramCashierSession"("approvalRequestId");
CREATE UNIQUE INDEX "TelegramCashierSession_completedPaymentId_key" ON "TelegramCashierSession"("completedPaymentId");
CREATE INDEX "TelegramCashierSession_staffIdentityId_createdAt_idx" ON "TelegramCashierSession"("staffIdentityId", "createdAt" DESC);
CREATE INDEX "TelegramCashierSession_status_updatedAt_idx" ON "TelegramCashierSession"("status", "updatedAt" DESC);

ALTER TABLE "TelegramStaffIdentity"
ADD CONSTRAINT "TelegramStaffIdentity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelegramCashierSession"
ADD CONSTRAINT "TelegramCashierSession_staffIdentityId_fkey"
FOREIGN KEY ("staffIdentityId") REFERENCES "TelegramStaffIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelegramCashierSession"
ADD CONSTRAINT "TelegramCashierSession_approvalRequestId_fkey"
FOREIGN KEY ("approvalRequestId") REFERENCES "AutomationApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TelegramCashierSession"
ADD CONSTRAINT "TelegramCashierSession_completedPaymentId_fkey"
FOREIGN KEY ("completedPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
