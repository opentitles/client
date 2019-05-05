(() => {
  'use strict';

  const extapi = getBrowserAPI();
  const endpoint = 'https://floris.amsterdam';

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

  // Answer to requests for title history
  extapi.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'getarticle') {
      fetch(`${endpoint}/opentitles/article/${encodeURIComponent(request.medium)}/${encodeURIComponent(request.id)}`)
          .then((response) => response.json())
          .then((result) => sendResponse(result));
    }

    // Needed to keep the port open
    return true;
  });
})();
