-- Drop old Clerk approval flow artifacts.
ALTER TABLE "User" DROP CONSTRAINT "User_approvalUpdatedById_fkey";
DROP INDEX "User_clerkId_key";

ALTER TABLE "User"
DROP COLUMN "approvalNote",
DROP COLUMN "approvalStatus",
DROP COLUMN "approvalUpdatedAt",
DROP COLUMN "approvalUpdatedById",
DROP COLUMN "clerkId";

-- Replace the old role enum with the internal admin role set.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'CASHIER',
  'BILLING',
  'METER_READER',
  'TECHNICIAN',
  'VIEWER'
);

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role"
USING (
  CASE
    WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'::"Role"
    WHEN "role"::text = 'MANAGER' THEN 'ADMIN'::"Role"
    WHEN "role"::text = 'BILLING_STAFF' THEN 'BILLING'::"Role"
    WHEN "role"::text = 'CASHIER' THEN 'CASHIER'::"Role"
    WHEN "role"::text = 'METER_READER' THEN 'METER_READER'::"Role"
    WHEN "role"::text = 'CUSTOMER_SERVICE' THEN 'TECHNICIAN'::"Role"
  END
);

DROP TYPE "Role_old";

ALTER TABLE "User"
RENAME COLUMN "active" TO "isActive";

ALTER TABLE "User"
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "passwordHash" TEXT;

UPDATE "User"
SET "passwordHash" = '$2b$12$MLIERQDdLMm0D/ZzJukeEu/fhdI0lMFO4DBaKUQWg.qdatlEairFa'
WHERE "passwordHash" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'VIEWER';

DROP TYPE "StaffApprovalStatus";
