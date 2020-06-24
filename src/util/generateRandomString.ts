/**
 * Generate a 16-char random string that conforms to /[0-9A-Z]{16}/
 * @return {string} A string consisting of 16 random alphanumeric uppercase characters.
 */
export const generateRandomString = (): string => {
  return (Math.random().toString(36).substring(5) + Math.random().toString(36).substring(5)).toUpperCase();
}