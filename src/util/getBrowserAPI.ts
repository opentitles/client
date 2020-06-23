/**
 * Return the API for this browser
 */
export const getBrowserAPI = (): typeof browser | typeof chrome => {
  try {
    return browser;
  } catch (e) {
    return chrome;
  }
}
