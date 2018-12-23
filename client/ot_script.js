(() => {
  'use strict';

  const extapi = getBrowserAPI();
  makeRequest(extapi.extension.getURL('/media.json')).then((result) => {
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
      return;
    }

    // No title element present - should definitely not happen in prod but it's here anyway for "graceful" degradation.
    if (!document.querySelector(medium.TITLE_QUERY)) {
      console.warn(
          'OpenTitles script was executed, but the current page doesn\'t contain a title element.'
      );
      return;
    }

    makeRequest(`https://floris.amsterdam/opentitles/article/${medium.NAME}/${window.location.href.match(medium.ID_MASK)[0]}`).then((titlehist) => {
      if (typeof(titlehist) !== 'object') {
        titlehist = JSON.parse(titlehist);
      }

      buildModal(titlehist, medium);
    });
  });

  /**
   * Make a request to a given URL - use with 'await'.
   * @param {String} url The target for the XMLHttpRequest.
   * @param {String} method The HTTP method to use - defaults to 'GET'.
   * @return {Promise} A promise that resolves with the result of the XMLHttpRequest to the given URL.
   */
  function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
      const xhr = getXHR();
      xhr.open(method, url);
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
   * Build the modal and button and inject these into the DOM.
   * @param {Object} data The response object from the OpenTitles API.
   * @param {Object} medium The medium corresponding to this domain, as defined in media.json.
   */
  function buildModal(data, medium) {
    document.body.classList.add(medium.NAME.replace(/\./gi, ''));

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
})();
