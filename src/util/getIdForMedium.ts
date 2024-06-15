import { MediumDefinition } from "../domain/MediumDefinition";
import { generateRandomString } from './generateRandomString';
import { CONFIG } from "../config";
import { dqs } from "./dqs";

/**
 * Retrieve the ID for this article/page so it can be used to query the API for the title history.
 * @param {MediumDefinition} medium The medium corresponding to this domain, as defined in media.json.
 * @param {Number} [retrycount=1] The amount of retries we are currently on, starts at 1.
 * @return {Promise<string | null>} A promise that will resolve with the ID for this article/page, or null if none is found.
 */
export const getIdForMedium = async (medium: MediumDefinition, retrycount = 1): Promise<string | null> => {
  return new Promise(async (resolve) => {
    switch (medium.page_id_location) {
      case 'var': {
        const locations = medium.page_id_query.split('.');

        // Extensions are sandboxed as far global variables like window are concerned - the DOM is shared however.
        // For that reason we'll use this real stupid workaround to retrieve window[first_var], since we cant JSON.stringify window.
        const scriptTag = document.createElement('script');
        const tagID = `ot_window_extractor_${generateRandomString()}`;
        scriptTag.id = tagID;
        scriptTag.type = 'text/javascript';
        scriptTag.text = `document.getElementById('${tagID}').innerText = JSON.stringify(window['${locations[0]}']);`;
        document.body.appendChild(scriptTag);

        let result = null;

        try {
          result = JSON.parse(dqs(`#${tagID}`).innerText);

          if (locations.length > 1) {
            for (let index = 1; index < locations.length; index++) {
              result = result[locations[index]];
            }
          }

          dqs(`#${tagID}`).remove();
          resolve(result);
          return result;
        } catch (e) {
          if (retrycount <= CONFIG.MAX_RETRIES.ID) {
            console.log(`Global variable '${medium.page_id_query}' is currently undefined, retrying in one second... ${retrycount}/${CONFIG.MAX_RETRIES.ID}`);
            dqs(`#${tagID}`).remove();
            setTimeout(() => {
              retrycount++;
              resolve(getIdForMedium(medium, retrycount));
            }, 1000);
          } else {
            console.warn(`Global variable '${medium.page_id_query}' was undefined at runtime`);
            dqs(`#${tagID}`).remove();
          }
        } finally {
          break;
        }
      }
      case 'page': {
        // Not yet implemented
        resolve(null);
        break;
      }
      case 'url':
      default: {
        const matches = window.location.href.match(medium.id_mask);
        if (matches) {
          resolve(matches[0]);
        } else {
          resolve(null);
        }
        break;
      }
    }
  });
}
