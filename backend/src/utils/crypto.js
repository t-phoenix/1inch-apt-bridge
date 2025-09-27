import crypto from 'crypto';
import { keccak256 } from 'ethers';
import { logger } from './logger.js';

/**
 * Generate a random 32-byte secret for HTLC
 * @returns {string} Hex-encoded 32-byte secret
 */
export function generateSecret() {
  const secret = crypto.randomBytes(32);
  logger.debug('Generated new HTLC secret');
  return secret.toString('hex');
}

/**
 * Generate keccak256 hash of the secret for cross-chain compatibility
 * Both Ethereum and Aptos will use keccak256 for consistency
 * @param {string} secret - Hex-encoded secret
 * @returns {string} Hex-encoded keccak256 hash
 */
export function generateHash(secret) {
  try {
    // Convert hex string to bytes
    const secretBytes = Buffer.from(secret, 'hex');
    
    // Use ethers keccak256 for Ethereum compatibility
    const hash = keccak256(secretBytes);
    
    logger.debug(`Generated keccak256 hash for secret`);
    return hash;
  } catch (error) {
    logger.error('Failed to generate hash:', error);
    throw new Error('Hash generation failed');
  }
}

/**
 * Generate keccak256 hash (alias for generateHash for clarity)
 * @param {string} secret - Hex-encoded secret
 * @returns {string} Hex-encoded keccak256 hash
 */
export function generateKeccak256Hash(secret) {
  return generateHash(secret);
}

/**
 * Verify if the preimage matches the hash using keccak256
 * @param {string} preimage - Hex-encoded preimage
 * @param {string} hash - Hex-encoded expected hash
 * @returns {boolean} True if preimage matches hash
 */
export function verifyPreimage(preimage, hash) {
  try {
    const computedHash = generateHash(preimage);
    const isValid = computedHash.toLowerCase() === hash.toLowerCase();
    
    logger.debug(`Preimage verification: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    logger.error('Failed to verify preimage:', error);
    return false;
  }
}

/**
 * Verify keccak256 preimage for Ethereum (alias for verifyPreimage)
 * @param {string} preimage - Hex-encoded preimage
 * @param {string} hash - Hex-encoded expected hash
 * @returns {boolean} True if preimage matches hash
 */
export function verifyKeccak256Preimage(preimage, hash) {
  return verifyPreimage(preimage, hash);
}

/**
 * Convert hex string to bytes for contract calls
 * @param {string} hex - Hex-encoded string
 * @returns {Uint8Array} Byte array
 */
export function hexToBytes(hex) {
  const cleanHex = hex.replace('0x', '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return bytes;
}

/**
 * Convert bytes to hex string
 * @param {Uint8Array} bytes - Byte array
 * @returns {string} Hex-encoded string
 */
export function bytesToHex(bytes) {
  return '0x' + Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a unique swap ID
 * @param {string} makerAddress - Maker's address
 * @param {string} resolverAddress - Resolver's address
 * @param {string} amount - Swap amount
 * @param {number} timestamp - Creation timestamp
 * @returns {string} Unique swap ID
 */
export function generateSwapId(makerAddress, resolverAddress, amount, timestamp) {
  const data = `${makerAddress}-${resolverAddress}-${amount}-${timestamp}`;
  return keccak256(Buffer.from(data, 'utf8'));
}

/**
 * Validate hash format (must be 32 bytes, hex-encoded)
 * @param {string} hash - Hash to validate
 * @returns {boolean} True if valid hash format
 */
export function validateHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  
  const cleanHash = hash.replace('0x', '');
  
  // Must be 64 hex characters (32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(cleanHash);
}

/**
 * Validate secret format (must be 32 bytes, hex-encoded)
 * @param {string} secret - Secret to validate
 * @returns {boolean} True if valid secret format
 */
export function validateSecret(secret) {
  if (!secret || typeof secret !== 'string') {
    return false;
  }
  
  const cleanSecret = secret.replace('0x', '');
  
  // Must be 64 hex characters (32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(cleanSecret);
}
