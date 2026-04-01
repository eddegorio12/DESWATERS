import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createApprovalToken() {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");

  return {
    token,
    tokenHash: hashToken(token),
  };
}

export function verifyApprovalToken(candidate: string, expectedHash: string) {
  const candidateHash = hashToken(candidate);

  return timingSafeEqual(Buffer.from(candidateHash), Buffer.from(expectedHash));
}
