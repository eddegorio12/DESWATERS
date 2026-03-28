CREATE TYPE "WorkOrderPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);

CREATE TYPE "WorkOrderStatus" AS ENUM (
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE "FieldWorkOrder" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldWorkOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FieldWorkOrder_complaintId_createdAt_idx"
ON "FieldWorkOrder"("complaintId", "createdAt" DESC);

CREATE INDEX "FieldWorkOrder_assignedToId_status_createdAt_idx"
ON "FieldWorkOrder"("assignedToId", "status", "createdAt" DESC);

CREATE INDEX "FieldWorkOrder_status_priority_createdAt_idx"
ON "FieldWorkOrder"("status", "priority", "createdAt" DESC);

ALTER TABLE "FieldWorkOrder"
ADD CONSTRAINT "FieldWorkOrder_complaintId_fkey"
FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FieldWorkOrder"
ADD CONSTRAINT "FieldWorkOrder_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FieldWorkOrder"
ADD CONSTRAINT "FieldWorkOrder_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FieldWorkOrder"
ADD CONSTRAINT "FieldWorkOrder_completedById_fkey"
FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
