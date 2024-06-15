import { MediumDefinition } from "../domain/MediumDefinition";
import { dqs } from "./dqs";
import { CONFIG } from "../config";

/** Search the current page for a title element corresponding to this medium */
export const getTitleElement = async (medium: MediumDefinition): Promise<HTMLElement | null> => {
  return new Promise((resolve) => {
    const selectors = medium.title_query;

    // Try to find a title element, but give up after 3 seconds if we can't find anything
    const searchInterval = setInterval(() => {
      selectors.forEach((selector) => {
        const result = dqs(selector);
        if (result) {
          resolve(result);
        }
      });
    }, 100);

    setTimeout(() => {
      clearInterval(searchInterval);
      resolve(null);
    }, CONFIG.TITLE_SEARCH_TIMEOUT)
  });
}
