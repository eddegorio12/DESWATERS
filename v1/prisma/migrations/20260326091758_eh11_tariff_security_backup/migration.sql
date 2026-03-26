-- CreateEnum
CREATE TYPE "TariffAuditEventType" AS ENUM ('CREATED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AdminLoginAttemptStatus" AS ENUM ('SUCCESS', 'FAILED', 'LOCKED_OUT');

-- CreateEnum
CREATE TYPE "BackupSnapshotStatus" AS ENUM ('RECORDED', 'VERIFIED', 'RESTORE_TESTED', 'FAILED');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "tariffId" TEXT;

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "effectiveFrom" TIMESTAMP(3),
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ADD COLUMN     "penaltyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reconnectionFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "Tariff"
SET "effectiveFrom" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "effectiveFrom" IS NULL;

ALTER TABLE "Tariff"
ALTER COLUMN "effectiveFrom" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "effectiveFrom" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedSignInCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFailedSignInAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TariffAuditEvent" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "TariffAuditEventType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TariffAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "status" "AdminLoginAttemptStatus" NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotMonth" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SUPABASE',
    "storageReference" TEXT NOT NULL,
    "status" "BackupSnapshotStatus" NOT NULL DEFAULT 'RECORDED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TariffAuditEvent_tariffId_createdAt_idx" ON "TariffAuditEvent"("tariffId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TariffAuditEvent_type_createdAt_idx" ON "TariffAuditEvent"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_email_attemptedAt_idx" ON "AdminLoginAttempt"("email", "attemptedAt" DESC);

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_userId_attemptedAt_idx" ON "AdminLoginAttempt"("userId", "attemptedAt" DESC);

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_status_attemptedAt_idx" ON "AdminLoginAttempt"("status", "attemptedAt" DESC);

-- CreateIndex
CREATE INDEX "BackupSnapshot_snapshotMonth_recordedAt_idx" ON "BackupSnapshot"("snapshotMonth", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "BackupSnapshot_status_recordedAt_idx" ON "BackupSnapshot"("status", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "Bill_tariffId_idx" ON "Bill"("tariffId");

-- CreateIndex
CREATE INDEX "Tariff_effectiveFrom_idx" ON "Tariff"("effectiveFrom" DESC);

-- CreateIndex
CREATE INDEX "Tariff_isActive_effectiveFrom_idx" ON "Tariff"("isActive", "effectiveFrom" DESC);

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffAuditEvent" ADD CONSTRAINT "TariffAuditEvent_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffAuditEvent" ADD CONSTRAINT "TariffAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLoginAttempt" ADD CONSTRAINT "AdminLoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupSnapshot" ADD CONSTRAINT "BackupSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
