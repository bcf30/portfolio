import { timingSafeEqual, scryptSync } from "node:crypto";
import { ADMIN_PASSWORD_HASH, ADMIN_PASSWORD } from "$app/env/private";

export function verifyPassword(providedPassword: string | null): boolean {
  if (!providedPassword) return false;

  const hashStr = ADMIN_PASSWORD_HASH || ADMIN_PASSWORD;
  if (!hashStr) return false;

  // Handle common mistake if the variable value includes "ADMIN_PASSWORD_HASH="
  const cleanHash = hashStr.startsWith("ADMIN_PASSWORD_HASH=")
    ? hashStr.replace("ADMIN_PASSWORD_HASH=", "")
    : hashStr;

  // Expecting format: salt:hash
  const parts = cleanHash.split(":");
  if (parts.length !== 2) {
    // Fallback for development if no colons (plain-text check)
    return providedPassword === cleanHash;
  }

  const [salt, key] = parts;
  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(providedPassword, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/** Shared guard for admin-only endpoints: a 401 response, or null when the password is valid. */
export function requireAdmin(request: Request): Response | null {
  if (verifyPassword(request.headers.get("x-admin-password"))) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
