import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey() {
  const value = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!value) throw new Error("Developer configuration required: OAUTH_TOKEN_ENCRYPTION_KEY is missing.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY must be a base64 encoded 32-byte key.");
  return key;
}

export function encryptToken(value: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptToken(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}
