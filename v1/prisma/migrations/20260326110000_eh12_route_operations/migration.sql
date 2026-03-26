CREATE TYPE "RouteResponsibility" AS ENUM ('METER_READING', 'BILL_DISTRIBUTION');

CREATE TABLE "ServiceZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffRouteAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceRouteId" TEXT NOT NULL,
    "responsibility" "RouteResponsibility" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffRouteAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Meter"
ADD COLUMN     "serviceRouteId" TEXT,
ADD COLUMN     "serviceZoneId" TEXT;

ALTER TABLE "BillPrintBatch"
ADD COLUMN     "serviceRouteId" TEXT,
ADD COLUMN     "serviceZoneId" TEXT;

CREATE UNIQUE INDEX "ServiceZone_name_key" ON "ServiceZone"("name");
CREATE UNIQUE INDEX "ServiceZone_code_key" ON "ServiceZone"("code");
CREATE INDEX "ServiceZone_name_idx" ON "ServiceZone"("name");

CREATE UNIQUE INDEX "ServiceRoute_code_key" ON "ServiceRoute"("code");
CREATE UNIQUE INDEX "ServiceRoute_zoneId_name_key" ON "ServiceRoute"("zoneId", "name");
CREATE INDEX "ServiceRoute_zoneId_name_idx" ON "ServiceRoute"("zoneId", "name");

CREATE UNIQUE INDEX "StaffRouteAssignment_userId_serviceRouteId_responsibility_key" ON "StaffRouteAssignment"("userId", "serviceRouteId", "responsibility");
CREATE INDEX "StaffRouteAssignment_serviceRouteId_responsibility_idx" ON "StaffRouteAssignment"("serviceRouteId", "responsibility");
CREATE INDEX "StaffRouteAssignment_userId_responsibility_idx" ON "StaffRouteAssignment"("userId", "responsibility");
CREATE INDEX "StaffRouteAssignment_releasedAt_idx" ON "StaffRouteAssignment"("releasedAt");

CREATE INDEX "Meter_serviceZoneId_idx" ON "Meter"("serviceZoneId");
CREATE INDEX "Meter_serviceRouteId_idx" ON "Meter"("serviceRouteId");

CREATE INDEX "BillPrintBatch_serviceZoneId_idx" ON "BillPrintBatch"("serviceZoneId");
CREATE INDEX "BillPrintBatch_serviceRouteId_idx" ON "BillPrintBatch"("serviceRouteId");

ALTER TABLE "ServiceRoute" ADD CONSTRAINT "ServiceRoute_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ServiceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffRouteAssignment" ADD CONSTRAINT "StaffRouteAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffRouteAssignment" ADD CONSTRAINT "StaffRouteAssignment_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_serviceZoneId_fkey" FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_serviceZoneId_fkey" FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillPrintBatch" ADD CONSTRAINT "BillPrintBatch_serviceRouteId_fkey" FOREIGN KEY ("serviceRouteId") REFERENCES "ServiceRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
