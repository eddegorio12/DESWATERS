CREATE TYPE "LeakReportStatus" AS ENUM (
    'OPEN',
    'INVESTIGATING',
    'RESOLVED',
    'CLOSED_NO_LEAK'
);

CREATE TABLE "LeakReport" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "status" "LeakReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "customerId" TEXT,
    "meterId" TEXT,
    "serviceZoneId" TEXT NOT NULL,
    "serviceRouteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeakReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepairHistory" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "repairSummary" TEXT NOT NULL,
    "repairDetail" TEXT,
    "recordedById" TEXT NOT NULL,
    "customerId" TEXT,
    "meterId" TEXT,
    "serviceZoneId" TEXT NOT NULL,
    "serviceRouteId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeakReport_complaintId_key" ON "LeakReport"("complaintId");
CREATE UNIQUE INDEX "RepairHistory_workOrderId_key" ON "RepairHistory"("workOrderId");

CREATE INDEX "LeakReport_status_createdAt_idx"
ON "LeakReport"("status", "createdAt" DESC);

CREATE INDEX "LeakReport_serviceRouteId_createdAt_idx"
ON "LeakReport"("serviceRouteId", "createdAt" DESC);

CREATE INDEX "LeakReport_serviceZoneId_createdAt_idx"
ON "LeakReport"("serviceZoneId", "createdAt" DESC);

CREATE INDEX "LeakReport_meterId_createdAt_idx"
ON "LeakReport"("meterId", "createdAt" DESC);

CREATE INDEX "LeakReport_customerId_createdAt_idx"
ON "LeakReport"("customerId", "createdAt" DESC);

CREATE INDEX "RepairHistory_completedAt_idx"
ON "RepairHistory"("completedAt" DESC);

CREATE INDEX "RepairHistory_meterId_completedAt_idx"
ON "RepairHistory"("meterId", "completedAt" DESC);

CREATE INDEX "RepairHistory_customerId_completedAt_idx"
ON "RepairHistory"("customerId", "completedAt" DESC);

CREATE INDEX "RepairHistory_serviceRouteId_completedAt_idx"
ON "RepairHistory"("serviceRouteId", "completedAt" DESC);

CREATE INDEX "RepairHistory_serviceZoneId_completedAt_idx"
ON "RepairHistory"("serviceZoneId", "completedAt" DESC);

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_complaintId_fkey"
FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_meterId_fkey"
FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_serviceZoneId_fkey"
FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeakReport"
ADD CONSTRAINT "LeakReport_serviceRouteId_fkey"
FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "FieldWorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_complaintId_fkey"
FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_recordedById_fkey"
FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_meterId_fkey"
FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_serviceZoneId_fkey"
FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RepairHistory"
ADD CONSTRAINT "RepairHistory_serviceRouteId_fkey"
FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
