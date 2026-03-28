import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_FIELD_PROOF_STORAGE_DIR = path.join(process.cwd(), "storage", "field-work-proofs");

export const FIELD_PROOF_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const FIELD_PROOF_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const FIELD_PROOF_MAX_FILES_PER_UPLOAD = 4;

export type PreparedFieldProofFile = {
  id: string;
  originalFilename: string;
  storagePath: string;
  contentType: string;
  fileSizeBytes: number;
  bytes: Buffer;
};

function sanitizeFilenameSegment(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "") || "proof";
}

function getFileExtension(filename: string, contentType: string) {
  const rawExtension = path.extname(filename).toLowerCase();

  if (rawExtension) {
    return rawExtension;
  }

  if (contentType === "image/png") {
    return ".png";
  }

  if (contentType === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}

export function getFieldProofStorageRoot() {
  const configured = process.env.DWDS_FIELD_PROOF_STORAGE_DIR?.trim();
  return path.resolve(configured ? configured : DEFAULT_FIELD_PROOF_STORAGE_DIR);
}

export function buildFieldProofAbsolutePath(storagePath: string) {
  return path.join(getFieldProofStorageRoot(), storagePath);
}

export async function persistPreparedFieldProofs(files: PreparedFieldProofFile[]) {
  if (!files.length) {
    return;
  }

  await mkdir(getFieldProofStorageRoot(), { recursive: true });

  for (const file of files) {
    const absolutePath = buildFieldProofAbsolutePath(file.storagePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.bytes);
  }
}

export async function removeStoredFieldProofs(storagePaths: string[]) {
  await Promise.all(
    storagePaths.map(async (storagePath) => {
      try {
        await unlink(buildFieldProofAbsolutePath(storagePath));
      } catch {
        // Best-effort cleanup only.
      }
    })
  );
}

export async function readStoredFieldProof(storagePath: string) {
  return readFile(buildFieldProofAbsolutePath(storagePath));
}

export async function prepareFieldProofFiles(files: File[]) {
  const preparedFiles: PreparedFieldProofFile[] = [];

  for (const file of files) {
    const originalFilename = file.name?.trim() || "field-proof";
    const contentType = file.type || "application/octet-stream";
    const extension = getFileExtension(originalFilename, contentType);
    const proofId = crypto.randomUUID();
    const monthBucket = new Date().toISOString().slice(0, 7);
    const sanitizedBaseName = sanitizeFilenameSegment(path.basename(originalFilename, extension));
    const storagePath = path.join(
      monthBucket,
      `${proofId}-${sanitizedBaseName}${extension}`
    );

    preparedFiles.push({
      id: proofId,
      originalFilename,
      storagePath,
      contentType,
      fileSizeBytes: file.size,
      bytes: Buffer.from(await file.arrayBuffer()),
    });
  }

  return preparedFiles;
}
