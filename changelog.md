### 1.9
OpenTitles will now lookup the title history for an article via a background script proxy, instead of directly from the content script.
This is more secure and is not blocked by future CORB-policies, such as those already in place in Chrome 73

- Switched out XMLHttpRequest API usage for the newer, more robust fetch API.
- Moved CORS request to background script.
- Added floris.amsterdam (HTTPS only) as allowed host.
- Properties in media.json are now lowercased as per best JSON-practices.

### 1.8
NOS title selector changed

### 1.7
Minor update to remove some broken feeds and add a few missing ones for NOS.

### 1.6
Small definitions fix

### 1.5
- Fixed window variable ID extraction for more than one property of window and added retries.

### 1.4
Add two new ways to extract the article ID from a page: var and page. 
Previously the ID had to be included in the URL for the plugin to be able to match an article to our records, now it can also be extracted from a global/window JS variable or an element on the page.
This update also includes definitions for some of the largest US media

- Added two fields to media.json: PAGE_ID_LOCATION and PAGE_ID_QUERY to define where and how the ID can be extracted.
- Fixed media.json parser in server.js - this should be refactored into a more readable set of methods in the future.
- Additional logging and checks.
- ID extraction method and switch on client script.
- Added media:
  - https://*.abcnews.go.com/*
  - https://*.cbsnews.com/*
  - https://*.cnn.com/*
  - https://*.msnbc.com/*
  - https://*.nytimes.com/*
  - https://*.latimes.com/*
  - https://*.usatoday.com/*
  - https://*.wsj.com/*
  - https://*.washingtonpost.com/*
  - https://*.vice.com/*
  - https://*.huffingtonpost.com/*
  - https://*.tmz.com/*
  - https://*.newsweek.com/*
  - http://*.time.com/*
  - https://*.theguardian.com/*
  - https://*.reuters.com/*

### 1.3
Make the popup look a bit more polished.

### 1.2
Added important features that will make it a lot easier to start adding more media down the line.

- Use unified media definitions shared by the server and the extension. This way media only have to be defined in one file.
- Move the media definitions down one level in the JSON config so that they are now properties of a country (i.e. NL, US, DE, BE, etc.)
- Switch the extension to load this list instead of using an internal array of media.
- Add a popup with a form to suggest the current website to be tracked by the API.
- Add endpoints to the server to process these suggestions.

### 1.1
Small compatiblity fix for Firefox's implementation of XMLHttpRequest

### 1.0
Initial release