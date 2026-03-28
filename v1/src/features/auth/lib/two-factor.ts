import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";

const OTP_DIGITS = 6;
const OTP_PERIOD_SECONDS = 30;
const OTP_WINDOW_STEPS = 1;
const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_SEGMENT_LENGTH = 4;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function normalizeBase32(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-7]/g, "");
}

function getTwoFactorKeyMaterial() {
  const secret = process.env.DWDS_2FA_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("DWDS 2FA requires DWDS_2FA_ENCRYPTION_KEY or AUTH_SECRET.");
  }

  return createHmac("sha256", "dwds-2fa-key").update(secret).digest();
}

function encodeBase32(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(secret: string) {
  const normalized = normalizeBase32(secret);
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);

    if (index === -1) {
      continue;
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function formatBase32Secret(secret: string) {
  return normalizeBase32(secret).match(/.{1,4}/g)?.join(" ") ?? secret;
}

function getHotpCode(secret: string, counter: number) {
  const key = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binaryCode % 10 ** OTP_DIGITS).toString().padStart(OTP_DIGITS, "0");
}

function normalizeVerificationCode(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeRecoveryCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateTwoFactorSecret() {
  return encodeBase32(randomBytes(20));
}

export function createOtpAuthUri(input: { email: string; secret: string; issuer?: string }) {
  const issuer = input.issuer ?? "DWDS";
  const accountLabel = encodeURIComponent(`${issuer}:${input.email}`);
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedSecret = encodeURIComponent(normalizeBase32(input.secret));

  return `otpauth://totp/${accountLabel}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${OTP_DIGITS}&period=${OTP_PERIOD_SECONDS}`;
}

export function verifyTwoFactorCode(input: {
  secret: string;
  code: string;
  now?: Date;
  window?: number;
}) {
  const normalizedCode = normalizeVerificationCode(input.code);

  if (normalizedCode.length !== OTP_DIGITS) {
    return false;
  }

  const now = input.now ?? new Date();
  const currentStep = Math.floor(now.getTime() / 1000 / OTP_PERIOD_SECONDS);
  const window = input.window ?? OTP_WINDOW_STEPS;

  for (let offset = -window; offset <= window; offset += 1) {
    const expectedCode = getHotpCode(input.secret, currentStep + offset);

    if (timingSafeEqual(Buffer.from(normalizedCode), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

export function encryptTwoFactorSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getTwoFactorKeyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(normalizeBase32(secret), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTwoFactorSecret(ciphertext: string) {
  const [iv, authTag, encrypted] = ciphertext.split(".");

  if (!iv || !authTag || !encrypted) {
    throw new Error("Invalid DWDS 2FA secret payload.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getTwoFactorKeyMaterial(),
    Buffer.from(iv, "base64url")
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    Array.from({ length: 2 }, () =>
      randomBytes(RECOVERY_CODE_SEGMENT_LENGTH)
        .toString("hex")
        .slice(0, RECOVERY_CODE_SEGMENT_LENGTH)
        .toUpperCase()
    ).join("-")
  );
}

export function formatTwoFactorSecret(secret: string) {
  return formatBase32Secret(secret);
}

export function normalizeRecoveryCodeInput(value: string) {
  return normalizeRecoveryCode(value);
}

export function hashRecoveryCode(value: string) {
  return createHmac("sha256", getTwoFactorKeyMaterial())
    .update(normalizeRecoveryCodeInput(value))
    .digest("base64url");
}
