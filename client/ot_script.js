(() => {
  'use strict';

  const endpoint = 'https://floris.amsterdam';

  const extapi = getBrowserAPI();

  makeGetRequest(extapi.extension.getURL('/media.json')).then(async (result) => {
    if (!result) {
      throw new Error('Media.json could not be loaded. This is most likely because it\'s not present in the extension directory, or because it\'s not defined in manifest.json.');
    }

    if (typeof(result) !== 'object') {
      result = JSON.parse(result);
    }

    let medium;

    for (const key in result.FEEDS) {
      if (result.FEEDS.hasOwnProperty(key)) {
        const feed = result.FEEDS[key];

        medium = feed.find((entry) => {
          return entry.MATCH_DOMAINS.includes(window.location.hostname.replace('www.', ''));
        });

        if (medium) {
          break;
        }
      }
    }

    // No entry for medium, exit.
    if (!medium) {
      console.log('No entry for medium, exiting');
      return;
    }

    // No title element present - should definitely not happen in prod but it's here anyway for "graceful" degradation.
    if (!document.querySelector(medium.TITLE_QUERY)) {
      console.warn(
          'OpenTitles script was executed, but the current page doesn\'t contain a title element.'
      );
      return;
    }

    setTimeout(async () => {
      const id = await getIdForMedium(medium);

      makeGetRequest(endpoint + `/opentitles/article/${encodeURIComponent(medium.NAME)}/${encodeURIComponent(id)}`).then((titlehist) => {
        if (typeof(titlehist) !== 'object') {
          titlehist = JSON.parse(titlehist);
        }
  
        if (!titlehist) {
          return;
        }
  
        buildModal(titlehist, medium);
      });
    }, 500)
  });

  /**
   * Make a GET request to a given URL - use with 'await'.
   * @param {String} url The target for the XMLHttpRequest.
   * @return {Promise} A promise that resolves with the result of the XMLHttpRequest to the given URL.
   */
  function makeGetRequest(url) {
    return new Promise((resolve, reject) => {
      const xhr = getXHR();
      xhr.open('GET', url);
      xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function() {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send();
    });
  }

  /**
   * Get the browser API object regardless of browser.
   * @return {Object} Browser extension API.
   */
  function getBrowserAPI() {
    try {
      return browser;
    } catch (e) {
      try {
        return chrome;
      } catch (e) {
        return null;
      }
    }
  }

  /**
   * Retrieve the ID for this article/page so it can be used to query the API for the title history.
   * @param {Object} medium The medium corresponding to this domain, as defined in media.json.
   * @return {Promise} A promise that will resolve with the ID for this article/page, or null if none is found.
   */
  function getIdForMedium(medium) {
    return new Promise(async (resolve, reject) => {
      switch (medium.PAGE_ID_LOCATION) {
        case 'var':
          // Extensions are sandboxed as far global variables like window are concerned - the DOM is shared however.
          // For that reason we'll use this real stupid workaround to retrieve window[first_var], since we cant JSON.stringify window.
          const scriptTag = document.createElement('script');
          const tagID = 'ot_window_extractor_' + randomstring();
          scriptTag.id = tagID;
          scriptTag.type = 'text/javascript';
          scriptTag.text = `document.getElementById('${tagID}').innerText = JSON.stringify(window['${medium.PAGE_ID_QUERY}']);`;
          document.body.appendChild(scriptTag);

          let result = null;

          try {
            result = JSON.parse(document.querySelector(`#${tagID}`).innerText);
          } catch (e) {
            console.warn(`Global variable ${medium.PAGE_ID_LOCATION} was undefined at runtime.`);
          } finally {
            resolve(result);
            return result;
            break;
          };
        case 'page':
          // Not yet implemented
          resolve(null);
          break;
        case 'url':
          resolve(window.location.href.match(medium.ID_MASK)[0]);
          break;
        default:
          resolve(window.location.href.match(medium.ID_MASK)[0]);
          break;
      }
    });
  }

  /**
   * Build the modal and button and inject these into the DOM.
   * @param {Object} data The response object from the OpenTitles API.
   * @param {Object} medium The medium corresponding to this domain, as defined in media.json.
   */
  function buildModal(data, medium) {
    // Remove periods and spaces from the medium name, these are not allowed in classes.
    document.body.classList.add(medium.NAME.replace(/\.| /gi, ''));

    // Append 'clock' symbol to title
    const titleElement = document.querySelector(medium.TITLE_QUERY);
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
    titleElement.appendChild(append);

    // Article meta
    document.querySelector('.opentitles__titlemeta').innerHTML = `<span><i class="opentitles__histicon" aria-hidden="true"></i> OpenTitles</span><div class="opentitles__closemodal">×</div>`;
    document.querySelector('.opentitles__button').onclick = toggleModal;
    document.querySelector('.opentitles__closemodal').onclick = toggleModal;

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

      document.querySelector('.opentitles__titlelist').appendChild(item);
    });
  }

  /**
   * Toggle the modal that contains the list of titles.
   */
  function toggleModal() {
    document.querySelector('.opentitles__container').classList.toggle('opentitles__verstoppertje');
  };

  /**
   * Compatiblity shim to retrieve the wrapped XHR object - Firefox doesn't allow usage of the plain XMLHttpRequest.
   * @return {XMLHttpRequest} The properly wrapped XHR object.
   */
  function getXHR() {
    try {
      // eslint-disable-next-line new-cap
      return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
    } catch (evt) {
      return new XMLHttpRequest();
    }
  }

  /**
   * Generate a 16-char random string that conforms to /[0-9A-Z]{16}/
   * @return {String} A string consisting of 16 random alphanumeric uppercase characters.
   */
  function randomstring() {
    return (Math.random().toString(36).substring(5) + Math.random().toString(36).substring(5)).toUpperCase();
  }
})();
