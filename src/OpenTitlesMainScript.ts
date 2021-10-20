import { getBrowserAPI } from "./util/getBrowserAPI";
import { FeedList } from "./domain/FeedList";
import { MediumDefinition } from "./domain/MediumDefinition";
import { dqs } from "./util/dqs";
import { Article } from "./domain/Article";
import { getTitleElement } from "./util/getTitleElement";
import { getIdForMedium } from "./util/getIdForMedium";

const extapi = getBrowserAPI();

fetch(extapi.runtime.getURL('/media.json'))
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
        // Assign country to medium
        medium.lang = key;
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
 * @param {MediumDefinition} medium The medium to which the article belongs.
 * @param {string} articleID The ID of the article to query, must belong to an article published by $medium.
 */
const getArticle = async (medium: MediumDefinition, articleID: string): Promise<Article> => {
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
 * Method to execute when a medium entry exists for the current website.
 * @param {MediumDefinition} medium The medium corresponding to this domain, as defined in media.json.
 */
const doWhenMediumIsFound = async (medium: MediumDefinition) => {
  const id = await getIdForMedium(medium);
  const titleElement = await getTitleElement(medium);

  if (!id) {
    console.warn(`OpenTitles script was executed, but no ID could be extracted from the current page.`);
    return;
  }

  if (!titleElement) {
    console.warn(`OpenTitles script was executed, but the current page doesn't contain a title element (tried selectors ${medium.title_query.join(', ')}).`);
    return;
  }

  getArticle(medium, id).then((titlehist) => {
    if (typeof (titlehist) !== 'object') {
      titlehist = JSON.parse(titlehist);
    }

    if (!titlehist) {
      return;
    }

    buildModal(titlehist, medium, titleElement);
  });
}

/**
 * Build the modal and button and inject these into the DOM.
 * @param {Article} data The response object from the OpenTitles API.
 * @param {MediumDefinition} medium The medium corresponding to this domain, as defined in media.json.
 */
const buildModal = async (data: Article, medium: MediumDefinition, titleElement: HTMLElement): Promise<void> => {
  // Remove periods and spaces from the medium name, these are not allowed in classes.
  document.body.classList.add(medium.name.replace(/\.| /gi, ''));

  // Append 'clock' symbol to title
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
