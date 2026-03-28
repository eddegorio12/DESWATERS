CREATE TABLE "FieldWorkProof" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldWorkProof_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FieldWorkProof_storagePath_key"
ON "FieldWorkProof"("storagePath");

CREATE INDEX "FieldWorkProof_workOrderId_createdAt_idx"
ON "FieldWorkProof"("workOrderId", "createdAt" DESC);

CREATE INDEX "FieldWorkProof_createdAt_idx"
ON "FieldWorkProof"("createdAt" DESC);

ALTER TABLE "FieldWorkProof"
ADD CONSTRAINT "FieldWorkProof_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "FieldWorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FieldWorkProof"
ADD CONSTRAINT "FieldWorkProof_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
