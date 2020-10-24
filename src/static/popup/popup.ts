// eslint-disable-next-line
// @ts-nocheck
(() => {
  'use strict';

  const endpoint = 'https://floris.amsterdam';

  const extapi = getBrowserAPI();
  makeRequest(extapi.extension.getURL('/media.json'), 'GET').then((result) => {
    if (typeof(result) !== 'object') {
      result = JSON.parse(result);
    }

    chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs) {
      let medium;
      let url = tabs[0].url;
      url = new URL(url);
      const hostname = url.hostname.replace('www.', '');

      for (const key in result.FEEDS) {
        if (result.FEEDS.hasOwnProperty(key)) {
          const feed = result.FEEDS[key];

          medium = feed.find((entry) => {
            return entry.MATCH_DOMAINS.includes(hostname);
          });

          if (medium) {
            break;
          }
        }
      }

      if (medium) {
        document.querySelector('.status').textContent = 'This website is being tracked by OpenTitles. You can use this window on untracked websites to suggest they be added to the tracking list.';
      } else {
        document.querySelector('.status').textContent = 'OpenTitles is not yet tracking this website. If you think it should, you can suggest it using the form below.';
        document.querySelector('.suggestform').classList.remove('hidden');

        document.querySelector('.suggestform').addEventListener('submit', function(event) {
          event.preventDefault();
          event.stopPropagation();

          const data = {
            url: hostname,
            rss_present: document.querySelector('#hasrss').checked,
            rss_overview: document.querySelector('#rss_overview').value,
            has_id: document.querySelector('#hasid').checked,
          };

          makeRequest(endpoint + '/opentitles/suggest', 'POST', data);
        });
      }
    });
  });

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
   * Make a GET request to a given URL - use with 'await'.
   * @param {String} url The target for the XMLHttpRequest.
   * @param {String} method The HTTP method to use.
   * @param {Object} data The data to include with the request. Will be parsed and sent as JSON.
   * @return {Promise} A promise that resolves with the result of the XMLHttpRequest to the given URL.
   */
  function makeRequest(url, method, data) {
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

      if (method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send();
      }
    });
  }
})();
