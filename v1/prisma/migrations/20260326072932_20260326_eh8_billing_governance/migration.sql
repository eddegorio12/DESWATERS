-- CreateEnum
CREATE TYPE "BillingCycleStatus" AS ENUM ('OPEN', 'CLOSED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "BillPrintGrouping" AS ENUM ('ALL', 'ZONE', 'ROUTE', 'PUROK', 'MANUAL');

-- CreateEnum
CREATE TYPE "BillPrintBatchStatus" AS ENUM ('DRAFT', 'PRINTED', 'DISTRIBUTED', 'RETURNED', 'FAILED_DELIVERY');

-- CreateEnum
CREATE TYPE "BillingCycleEventType" AS ENUM ('CYCLE_CREATED', 'CYCLE_CLOSED', 'CYCLE_REOPENED', 'CYCLE_FINALIZED', 'BILLS_REGENERATED', 'PRINT_BATCH_CREATED', 'PRINT_BATCH_PRINTED', 'PRINT_BATCH_DISTRIBUTED', 'PRINT_BATCH_RETURNED', 'PRINT_BATCH_FAILED_DELIVERY', 'SINGLE_BILL_REPRINTED', 'CHECKLIST_UPDATED');

-- CreateEnum
CREATE TYPE "BillLifecycleStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "BillDistributionStatus" AS ENUM ('PENDING_PRINT', 'PRINTED', 'DISTRIBUTED', 'RETURNED', 'FAILED_DELIVERY');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "billingCycleId" TEXT,
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "distributedAt" TIMESTAMP(3),
ADD COLUMN     "distributedById" TEXT,
ADD COLUMN     "distributionStatus" "BillDistributionStatus" NOT NULL DEFAULT 'PENDING_PRINT',
ADD COLUMN     "failedDeliveryAt" TIMESTAMP(3),
ADD COLUMN     "failedDeliveryById" TEXT,
ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedById" TEXT,
ADD COLUMN     "lifecycleStatus" "BillLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "printBatchId" TEXT,
ADD COLUMN     "printedAt" TIMESTAMP(3),
ADD COLUMN     "printedById" TEXT,
ADD COLUMN     "reprintCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "returnedAt" TIMESTAMP(3),
ADD COLUMN     "returnedById" TEXT;

-- CreateTable
CREATE TABLE "BillingCycle" (
    "id" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "billingPeriodLabel" TEXT NOT NULL,
    "status" "BillingCycleStatus" NOT NULL DEFAULT 'OPEN',
    "checklistReviewCompleted" BOOLEAN NOT NULL DEFAULT false,
    "checklistReceivablesVerified" BOOLEAN NOT NULL DEFAULT false,
    "checklistPrintReady" BOOLEAN NOT NULL DEFAULT false,
    "checklistDistributionReady" BOOLEAN NOT NULL DEFAULT false,
    "checklistMonthEndLocked" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedById" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "finalizedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillPrintBatch" (
    "id" TEXT NOT NULL,
    "billingCycleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "grouping" "BillPrintGrouping" NOT NULL DEFAULT 'ALL',
    "groupingValue" TEXT,
    "status" "BillPrintBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3),
    "printedById" TEXT,
    "distributedAt" TIMESTAMP(3),
    "distributedById" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnedById" TEXT,
    "failedDeliveryAt" TIMESTAMP(3),
    "failedDeliveryById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillPrintBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCycleEvent" (
    "id" TEXT NOT NULL,
    "billingCycleId" TEXT NOT NULL,
    "type" "BillingCycleEventType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "billId" TEXT,
    "billPrintBatchId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingCycle_periodKey_key" ON "BillingCycle"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCycle_billingPeriodLabel_key" ON "BillingCycle"("billingPeriodLabel");

-- CreateIndex
CREATE INDEX "BillingCycle_status_idx" ON "BillingCycle"("status");

-- CreateIndex
CREATE INDEX "BillPrintBatch_billingCycleId_status_idx" ON "BillPrintBatch"("billingCycleId", "status");

-- CreateIndex
CREATE INDEX "BillingCycleEvent_billingCycleId_occurredAt_idx" ON "BillingCycleEvent"("billingCycleId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "BillingCycleEvent_type_idx" ON "BillingCycleEvent"("type");

-- CreateIndex
CREATE INDEX "Bill_billingCycleId_lifecycleStatus_idx" ON "Bill"("billingCycleId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Bill_distributionStatus_idx" ON "Bill"("distributionStatus");

-- CreateIndex
CREATE INDEX "Bill_printBatchId_idx" ON "Bill"("printBatchId");

-- AddForeignKey
ALTER TABLE "BillingCycle" ADD CONSTRAINT "BillingCycle_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCycle" ADD CONSTRAINT "BillingCycle_reopenedById_fkey" FOREIGN KEY ("reopenedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCycle" ADD CONSTRAINT "BillingCycle_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "BillingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_printedById_fkey" FOREIGN KEY ("printedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_distributedById_fkey" FOREIGN KEY ("distributedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_failedDeliveryById_fkey" FOREIGN KEY ("failedDeliveryById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCycleEvent" ADD CONSTRAINT "BillingCycleEvent_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "BillingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCycleEvent" ADD CONSTRAINT "BillingCycleEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "BillingCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_printBatchId_fkey" FOREIGN KEY ("printBatchId") REFERENCES "BillPrintBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_printedById_fkey" FOREIGN KEY ("printedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_distributedById_fkey" FOREIGN KEY ("distributedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_failedDeliveryById_fkey" FOREIGN KEY ("failedDeliveryById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
