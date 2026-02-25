/**
 * Utilitaires pour la génération de codes de session.
 */

/**
 * Génère un code de session court et lisible.
 * Format : CSE-XXXX (4 caractères alphanumériques majuscules)
 * Exemple : CSE-A3K9
 */
export function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sans 0/O/1/I pour éviter la confusion
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  let code = "CSE-";
  for (let i = 0; i < 4; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}
