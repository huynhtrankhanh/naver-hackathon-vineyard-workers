// libsodium-wrappers-sumo lacks bundled TypeScript declarations; declare module in a global .d.ts if needed.
// @ts-ignore
import sodium from 'libsodium-wrappers-sumo';

// Fixed random salt for this website - this provides site-specific password hashing
// This ensures leaked passwords from this site cannot be compared against other sites
const SITE_SALT = 'MoneyTrack_2024_FixedSalt_3f8a9b2c1d4e5f6a';

/**
 * Hash password using argon2id (via libsodium) with salt derived from username AND a fixed site salt
 * This implements "server relief" approach with additional security:
 * - Username-derived salt: Makes rainbow tables ineffective
 * - Fixed site salt: Prevents cross-site password database comparison
 */
export async function hashPassword(password: string, username: string): Promise<string> {
  // Wait for libsodium to be ready
  await sodium.ready;

  // Combine username and fixed site salt to create a unique salt
  const saltString = `${username.toLowerCase()}_${SITE_SALT}`;
  const encoder = new TextEncoder();
  const saltData = encoder.encode(saltString);
  
  // Create a fixed-length salt (16 bytes required by argon2)
  const salt = new Uint8Array(16);
  for (let i = 0; i < salt.length; i++) {
    salt[i] = saltData[i % saltData.length] ^ (i * 7); // XOR with position for better distribution
  }

  try {
    // Use argon2id algorithm with libsodium
    const hash = sodium.crypto_pwhash(
      32, // output length (32 bytes = 256 bits)
      password,
      salt,
      2, // opslimit (iterations) - INTERACTIVE level
      19456 * 1024, // memlimit (19 MB in bytes)
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    // Convert to hex string
    return sodium.to_hex(hash);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}
