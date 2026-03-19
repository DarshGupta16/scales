/**
 * Generates a valid PocketBase ID.
 * PocketBase IDs are exactly 15 characters long and consist of lowercase letters and numbers.
 */
export const generatePbId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 15; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};
