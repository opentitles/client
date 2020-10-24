import { getBrowserAPI } from "./util/getBrowserAPI";
import { BackgroundMessage } from "./domain/BackgroundMessage";
import { CONFIG } from "./config";

const extapi = getBrowserAPI();

// Answer to requests for title history
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
extapi.runtime.onMessage.addListener((request: BackgroundMessage, sender: unknown, sendResponse: (response?: any) => void) => {
  if (request.type == 'getarticle') {
    // See https://opentitles.info/ for all endpoints
    fetch(`${CONFIG.API_URL}/v${CONFIG.API_VERSION}/country/${request.medium.lang}/org/${encodeURIComponent(request.medium.name)}/article/${encodeURIComponent(request.id)}`)
      .then((response) => response.json())
      .then((result) => sendResponse(result));
  }

  // Needed to keep the port open
  return true;
});