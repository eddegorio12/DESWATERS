ALTER TYPE "AuthAdminManagementEventType"
ADD VALUE IF NOT EXISTS 'TWO_FACTOR_ENABLED';

ALTER TYPE "AuthAdminManagementEventType"
ADD VALUE IF NOT EXISTS 'TWO_FACTOR_DISABLED';

ALTER TABLE "User"
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorSecretCiphertext" TEXT,
ADD COLUMN "twoFactorPendingSecretCiphertext" TEXT,
ADD COLUMN "twoFactorRecoveryCodeHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3),
ADD COLUMN "twoFactorLastVerifiedAt" TIMESTAMP(3);
