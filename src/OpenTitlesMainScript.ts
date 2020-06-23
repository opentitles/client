import { getBrowserAPI } from "./util/getBrowserAPI";
import { FeedList } from "./domain/FeedList";
import { MediumDefinition } from "./domain/MediumDefinition";
import { dqs } from "./util/dqs";
import { CONFIG } from "./config";
import { Article } from "./domain/Article";

const extapi = getBrowserAPI();

fetch(extapi.extension.getURL('/media.json'))
.then((response) => response.json())
.then(async (uncastResult) => {
  if (!uncastResult) {
    throw new Error('Media.json could not be loaded. This is most likely because it\'s not present in the extension directory, or because it\'s not defined as a web accessible resource in manifest.json.');
  }

  const result = uncastResult as {'feeds': FeedList};

  let medium: MediumDefinition | undefined;

  for (const key in result.feeds) {
    if (result.feeds.hasOwnProperty(key)) {
      const feed = result.feeds[key];

      medium = feed.find((entry) => {
        return entry.match_domains.includes(window.location.hostname.replace('www.', ''));
      });

      if (medium) {
        break;
      }
    }
  }

  if (!medium) {
    console.log('No entry for medium, exiting');
    return;
  }

  doWhenMediumIsFound(medium);
});

/**
 * Query the background script for the title history of an article.
 * @param {string} medium The name of the medium to which the article belongs.
 * @param {string} articleID The ID of the article to query, must belong to an article published by $medium.
 */
const getArticle = async (medium: string, articleID: string): Promise<Article> => {
  return new Promise((resolve) => {
    (extapi as typeof chrome).runtime.sendMessage({
      type: 'getarticle',
      medium: medium,
      id: articleID,
    }, (response) => {
      resolve(response);
    });
  });
}

/**
 * Retrieve the ID for this article/page so it can be used to query the API for the title history.
 * @param {MediumDefinition} medium The medium corresponding to this domain, as defined in media.json.
 * @param {Number} [retrycount=1] The amount of retries we are currently on, starts at 1.
 * @return {Promise<string | null>} A promise that will resolve with the ID for this article/page, or null if none is found.
 */
const getIdForMedium = async (medium: MediumDefinition, retrycount = 1): Promise<string | null> => {
  return new Promise(async (resolve) => {
    switch (medium.page_id_location) {
      case 'var':
        const locations = medium.page_id_query.split('.');

        // Extensions are sandboxed as far global variables like window are concerned - the DOM is shared however.
        // For that reason we'll use this real stupid workaround to retrieve window[first_var], since we cant JSON.stringify window.
        const scriptTag = document.createElement('script');
        const tagID = 'ot_window_extractor_' + randomstring();
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
      case 'page':
        // Not yet implemented
        resolve(null);
        break;
      case 'url':
        resolve((window.location.href.match(medium.id_mask) as Array<string>)[0]);
        break;
      default:
        resolve((window.location.href.match(medium.id_mask) as Array<string>)[0]);
        break;
    }
  });
}

/**
 * Method to execute when a medium entry exists for the current website.
 * @param {MediumDefinition} medium The medium corresponding to this domain, as defined in media.json.
 * @param {Number} [retrycount=1] The amount of retries we are currently on, starts at 1.
 */
const doWhenMediumIsFound = async (medium: MediumDefinition, retrycount = 1) => {
  // No title element present - may occur when a site undergoes a restyling/HTML change, so it's here for graceful degradation.
  if (!dqs(medium.title_query)) {
    if (retrycount <= CONFIG.MAX_RETRIES.TITLE) {
      console.log(`OpenTitles script was executed, but the current page doesn't contain a title element (yet), retrying in one second... ${retrycount}/${CONFIG.MAX_RETRIES.TITLE}`);

      retrycount++;

      setTimeout(() => {
        doWhenMediumIsFound(medium, retrycount);
      }, 1000);
    } else {
      console.warn(`OpenTitles script was executed, but the current page doesn't contain a title element.`);
    }

    return;
  }

  const id = await getIdForMedium(medium);

  if (!id) {
    console.warn(`OpenTitles script was executed, but no ID could be extracted from the current page.`);
    return;
  }

  getArticle(medium.name, id).then((titlehist) => {
    if (typeof (titlehist) !== 'object') {
      titlehist = JSON.parse(titlehist);
    }

    if (!titlehist) {
      return;
    }

    buildModal(titlehist, medium);
  });
}

/**
 * Build the modal and button and inject these into the DOM.
 * @param {Article} data The response object from the OpenTitles API.
 * @param {MediumDefinition} medium The medium corresponding to this domain, as defined in media.json.
 */
const buildModal = (data: Article, medium: MediumDefinition) => {
  // Remove periods and spaces from the medium name, these are not allowed in classes.
  document.body.classList.add(medium.name.replace(/\.| /gi, ''));

  // Append 'clock' symbol to title
  const titleElement = dqs(medium.title_query);
  const append = document.createElement('div');
  append.title = 'Click to open the OpenTitles overlay';
  append.textContent = '';
  append.classList.add('opentitles__button', 'opentitles__histicon');

  // Append information card to body
  const card = document.createElement('div');
  card.classList.add('opentitles__container');
  const meta = document.createElement('div');
  meta.classList.add('opentitles__titlemeta');
  const list = document.createElement('ul');
  list.classList.add('opentitles__titlelist');
  card.appendChild(meta);
  card.appendChild(list);
  document.body.appendChild(card);

  // Timeout added here for websites that reflow the title/entire page after load (NYT, e.g.).
  // This would cause the OpenTitles container to be moved to the body in some cases.
  setTimeout(() => {
    titleElement.appendChild(append);

    // Article meta
    dqs('.opentitles__titlemeta').innerHTML = `<span><i class="opentitles__histicon" aria-hidden="true"></i> OpenTitles</span><div class="opentitles__closemodal">×</div>`;
    dqs('.opentitles__button').onclick = toggleModal;
    dqs('.opentitles__closemodal').onclick = toggleModal;

    data.titles.forEach((title) => {
      const item = document.createElement('li');
      item.classList.add('opentitles__titleitem');
      const date = document.createElement('span');
      date.classList.add('opentitles__titledate');
      date.innerText = `${title.datetime}: `;
      const content = document.createElement('span');
      content.innerText = title.title;
      item.appendChild(date);
      item.appendChild(content);

      dqs('.opentitles__titlelist').appendChild(item);
    });
  }, 2000);
}

/**
 * Toggle the modal that contains the list of titles.
 */
const toggleModal = (): void => {
  dqs('.opentitles__container').classList.toggle('opentitles__verstoppertje');
}

/**
 * Generate a 16-char random string that conforms to /[0-9A-Z]{16}/
 * @return {string} A string consisting of 16 random alphanumeric uppercase characters.
 */
const randomstring = (): string => {
  return (Math.random().toString(36).substring(5) + Math.random().toString(36).substring(5)).toUpperCase();
}
