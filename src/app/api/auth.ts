import { timingSafeEqual, scryptSync } from 'crypto';

export function verifyPassword(providedPassword: string | null): boolean {
  if (!providedPassword) return false;
  
  const hashStr = process.env.ADMIN_PASSWORD_HASH;
  if (!hashStr) {
    // Fallback for development if no hash is provided but ADMIN_PASSWORD is (the old way)
    const plain = process.env.ADMIN_PASSWORD;
    if (plain && providedPassword === plain) return true;
    return false;
  }

  // Expecting format: salt:hash
  const parts = hashStr.split(':');
  if (parts.length !== 2) return false;

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
