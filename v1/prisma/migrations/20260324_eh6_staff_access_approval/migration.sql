-- CreateEnum
CREATE TYPE "StaffApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "approvalNote" TEXT,
ADD COLUMN "approvalStatus" "StaffApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "approvalUpdatedAt" TIMESTAMP(3),
ADD COLUMN "approvalUpdatedById" TEXT;

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_approvalUpdatedById_fkey"
FOREIGN KEY ("approvalUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
