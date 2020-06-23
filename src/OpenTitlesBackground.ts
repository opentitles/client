import { getBrowserAPI } from "./util/getBrowserAPI";
import { BackgroundMessage } from "./domain/BackgroundMessage";
import { CONFIG } from "./config";

const extapi = getBrowserAPI();

// Answer to requests for title history
extapi.runtime.onMessage.addListener((request: BackgroundMessage, sender: unknown, sendResponse: (response?: any) => void) => {
  if (request.type == 'getarticle') {
    fetch(`${CONFIG.API_URL}/opentitles/article/${encodeURIComponent(request.medium)}/${encodeURIComponent(request.id)}`)
      .then((response) => response.json())
      .then((result) => sendResponse(result));
  }

  // Needed to keep the port open
  return true;
});