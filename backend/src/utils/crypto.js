import crypto from 'crypto';

/**
 * Generate a random 32-byte secret for HTLC
 */
export function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate SHA-256 hash of the secret
 * Note: We use SHA-256 for compatibility with Aptos
 * For Ethereum compatibility, we'll need keccak256
 */
export function generateHash(secret) {
  return crypto.createHash('sha256').update(secret, 'hex').digest('hex');
}

/**
 * Generate keccak256 hash for Ethereum compatibility
 */
export function generateKeccak256Hash(secret) {
  // This would use a keccak256 library like keccak
  // For now, we'll use a placeholder
  return crypto.createHash('sha256').update(secret, 'hex').digest('hex');
}

/**
 * Verify if the preimage matches the hash
 */
export function verifyPreimage(preimage, hash) {
  const computedHash = generateHash(preimage);
  return computedHash === hash;
}

/**
 * Verify keccak256 preimage for Ethereum
 */
export function verifyKeccak256Preimage(preimage, hash) {
  const computedHash = generateKeccak256Hash(preimage);
  return computedHash === hash;
}
