/**
 * Generate a N-char random string that conforms to /[0-9A-Z]{%length%}/
 * @param {number} [length = 16] The length of the random string, defaults to 16
 * @return {string} A string consisting of 16 random alphanumeric uppercase characters.
 */
export const generateRandomString = (length = 16): string => {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('').toUpperCase();
}