import { nanoid } from "nanoid"

/**
 * Generate a new API key.
 * Keys are stored in plaintext in the DB — they are long random strings
 * (sk_ prefix + 48 nanoid chars = ~290 bits of entropy) so they are
 * effectively unguessable without hashing.
 */
export function generateApiKey(): string {
  return `sk_${nanoid(48)}`
}
