import { CONFIG } from "../config";
import { dqs } from "../util/dqs";
import { FeedList } from "../domain/FeedList";
import { getBrowserAPI } from "../util/getBrowserAPI";
import { MediumDefinition } from '../domain/MediumDefinition';

const extapi = getBrowserAPI() as typeof chrome;

fetch(extapi.runtime.getURL('/media.json'), {
  method: 'GET'
}).then(response => response.json() as Promise<{ feeds: FeedList }>).then((mediaList) => {
  chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
    let medium;
    const url = new URL(tabs[0].url as string);
    const hostname = url.hostname.replace('www.', '');
    const feeds = mediaList.feeds;

    for (const country in feeds) {
      if (feeds.hasOwnProperty(country)) {
        const feed = mediaList.feeds[country];

        medium = (feed as MediumDefinition[]).find((entry) => {
          return entry.match_domains.includes(hostname);
        });

        if (medium) {
          break;
        }
      }
    }

    if (medium) {
      dqs('.status').textContent = 'This website is being tracked by OpenTitles. You can use this window on untracked websites to suggest they be added to the tracking list.';
    } else {
      dqs('.status').textContent = 'OpenTitles is not yet tracking this website. If you think it should, you can suggest it using the button below.';
      dqs('.suggestform').classList.remove('hidden');

      dqs('.suggestform').addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        const data = {
          url: hostname
        };

        fetch(`${CONFIG.API_URL}/v${CONFIG.API_VERSION}/suggest`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });
    }
  });
});
