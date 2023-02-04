import { CONFIG } from "../config";
import { dqs } from "../util/dqs";
import { FeedList } from "../domain/FeedList";
import { getBrowserAPI } from "../util/getBrowserAPI";

const extapi = getBrowserAPI() as typeof chrome;

fetch(extapi.runtime.getURL('/media.json'), {
  method: 'GET'
}).then(response => response.json()).then((result) => {
  chrome.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
    let medium;
    const url = new URL(tabs[0].url as string);
    const hostname = url.hostname.replace('www.', '');

    for (const key in (result as unknown as FeedList).feeds) {
      if ((result as unknown as FeedList).feeds.hasOwnProperty(key)) {
        const feed = (result as unknown as FeedList).feeds[key];

        medium = (feed as any).find((entry: any) => {
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
