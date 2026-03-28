CREATE TABLE "MeterReplacementHistory" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT,
    "complaintId" TEXT,
    "replacedMeterId" TEXT NOT NULL,
    "replacementMeterId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "customerId" TEXT,
    "serviceZoneId" TEXT NOT NULL,
    "serviceRouteId" TEXT NOT NULL,
    "finalReading" DOUBLE PRECISION,
    "replacementDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeterReplacementHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeterReplacementHistory_workOrderId_key"
ON "MeterReplacementHistory"("workOrderId");

CREATE INDEX "MeterReplacementHistory_replacementDate_idx"
ON "MeterReplacementHistory"("replacementDate" DESC);

CREATE INDEX "MeterReplacementHistory_replacedMeterId_replacementDate_idx"
ON "MeterReplacementHistory"("replacedMeterId", "replacementDate" DESC);

CREATE INDEX "MeterReplacementHistory_replacementMeterId_replacementDate_idx"
ON "MeterReplacementHistory"("replacementMeterId", "replacementDate" DESC);

CREATE INDEX "MeterReplacementHistory_customerId_replacementDate_idx"
ON "MeterReplacementHistory"("customerId", "replacementDate" DESC);

CREATE INDEX "MeterReplacementHistory_serviceRouteId_replacementDate_idx"
ON "MeterReplacementHistory"("serviceRouteId", "replacementDate" DESC);

CREATE INDEX "MeterReplacementHistory_serviceZoneId_replacementDate_idx"
ON "MeterReplacementHistory"("serviceZoneId", "replacementDate" DESC);

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "FieldWorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_complaintId_fkey"
FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_replacedMeterId_fkey"
FOREIGN KEY ("replacedMeterId") REFERENCES "Meter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_replacementMeterId_fkey"
FOREIGN KEY ("replacementMeterId") REFERENCES "Meter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_recordedById_fkey"
FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_serviceZoneId_fkey"
FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MeterReplacementHistory"
ADD CONSTRAINT "MeterReplacementHistory_serviceRouteId_fkey"
FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
