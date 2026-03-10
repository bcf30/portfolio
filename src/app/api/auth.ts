import { timingSafeEqual, scryptSync } from 'crypto';

export function verifyPassword(providedPassword: string | null): boolean {
  if (!providedPassword) return false;
  
  // Check for the hash string in environment
  const hashStr = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD;
  
  if (!hashStr) {
    return false;
  }

  // Handle common mistake if the variable name includes "ADMIN_PASSWORD_HASH="
  const cleanHash = hashStr.startsWith("ADMIN_PASSWORD_HASH=") 
    ? hashStr.replace("ADMIN_PASSWORD_HASH=", "") 
    : hashStr;

  // Expecting format: salt:hash
  const parts = cleanHash.split(':');
  if (parts.length !== 2) {
    // Fallback for development if no colons (plain-text check)
    return providedPassword === cleanHash;
  }

  const [salt, key] = parts;
  
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(providedPassword, salt, 64);
    
    if (keyBuffer.length !== derivedKey.length) return false;
    
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
