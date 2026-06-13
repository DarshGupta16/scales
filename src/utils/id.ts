/**
 * Generates a valid PocketBase ID.
 * PocketBase IDs are exactly 15 characters long and consist of lowercase letters and numbers.
 */
// Tested in tests/utils/id.test.ts
export const generatePbId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const randomValues = new Uint8Array(15);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 15; i++) {
    id += chars[randomValues[i] % chars.length];
  }
  return id;
};
