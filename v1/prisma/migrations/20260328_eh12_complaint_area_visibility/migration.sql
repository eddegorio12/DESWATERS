CREATE TYPE "ComplaintCategory" AS ENUM (
    'LEAK',
    'NO_WATER',
    'LOW_PRESSURE',
    'BILLING_DISPUTE',
    'METER_DAMAGE',
    'OTHER'
);

CREATE TYPE "ComplaintStatus" AS ENUM (
    'OPEN',
    'RESOLVED'
);

CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "category" "ComplaintCategory" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "meterId" TEXT,
    "serviceZoneId" TEXT NOT NULL,
    "serviceRouteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Complaint_serviceRouteId_reportedAt_idx"
ON "Complaint"("serviceRouteId", "reportedAt" DESC);

CREATE INDEX "Complaint_serviceZoneId_reportedAt_idx"
ON "Complaint"("serviceZoneId", "reportedAt" DESC);

CREATE INDEX "Complaint_status_reportedAt_idx"
ON "Complaint"("status", "reportedAt" DESC);

CREATE INDEX "Complaint_category_reportedAt_idx"
ON "Complaint"("category", "reportedAt" DESC);

CREATE INDEX "Complaint_customerId_reportedAt_idx"
ON "Complaint"("customerId", "reportedAt" DESC);

CREATE INDEX "Complaint_meterId_reportedAt_idx"
ON "Complaint"("meterId", "reportedAt" DESC);

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_meterId_fkey"
FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_serviceZoneId_fkey"
FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Complaint"
ADD CONSTRAINT "Complaint_serviceRouteId_fkey"
FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
