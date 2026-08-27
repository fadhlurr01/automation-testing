import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const value = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (value) {
    try {
      const key = Buffer.from(value, "base64");
      if (key.length === 32) return key;
    } catch {
      // Fall through to deterministic sha256 derivation
    }
  }
  const seed =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_JWT_SECRET ||
    "automation-hub-token-encryption-safe-seed-2026";
  return createHash("sha256").update(seed).digest();
}

export function encryptToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptToken(value: string): string {
  try {
    const [iv, tag, encrypted] = value.split(".");
    if (!iv || !tag || !encrypted) return value;
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return value;
  }
}
