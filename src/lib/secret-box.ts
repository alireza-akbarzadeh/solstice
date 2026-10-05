import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

import { env } from "@/env";

// Encrypts small secrets (payment keys) before they go into the database, with AES-256-GCM
// and a key derived from the server secret. Someone with a database dump but not the server's
// environment can't read them. Rotating BETTER_AUTH_SECRET makes stored secrets unreadable:
// they then read as missing and have to be pasted in again.

const key = () =>
  Buffer.from(hkdfSync("sha256", env.BETTER_AUTH_SECRET ?? "development", "solstice", "solstice-secret-box-v1", 32));

/** "v1.<iv>.<tag>.<ciphertext>", base64url. */
export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((part) => (typeof part === "string" ? part : part.toString("base64url"))).join(".");
}

/** The secret, or null when it was sealed with another key or has been tampered with. */
export function open(sealed: string): string | null {
  const [version, iv, tag, data] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
