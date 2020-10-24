### OpenTitles v2.10.0 (10/24/2020)
Use separate build paths for Chrome and Firefox so we can adjust the manifest for Chrome

### OpenTitles v2.9.0 (9/25/2020)


### OpenTitles v2.8.0 (9/25/2020)


### OpenTitles v2.7.0 (9/25/2020)
* ci: add firefox auto-publishing

* fix: add path to source directory

### OpenTitles v2.6.0 (9/25/2020)
* ci: add firefox auto-publishing

* fix: add path to source directory

### OpenTitles v2.5.0 (9/25/2020)
Fix popup not being visible

### OpenTitles v2.4.0 (9/25/2020)
Fix popup not being visible

### OpenTitles v2.3.0 (6/29/2020)
- Bump @types/chrome to 0.0.117
- Bump @typescript-eslint/eslint-plugin to 3.4.0
- Bump @typescript-eslint/parser to 3.4.0
- Bump eslint to 7.3.1

### OpenTitles v2.2.0 (6/29/2020)
Pin dependency versions

### OpenTitles v2.1.0 (6/24/2020)
Add automatic build script using Github Actions

### OpenTitles v2.0.0 (24/6/2020)
Massive (and long overdue) rewrite to Typescript.

- Definitions are now retrieved from the central definition repository for OpenTitles: <https://github.com/opentitles/definition>
- Removed the server files from the repository, these were migrated to <https://github.com/opentitles/server> back in February
- Rewrite the current codebase to TS
- Add Parcel to package the TS files into a set of distributable JS files

### OpenTitles v1.9 (5/5/2019)
OpenTitles will now lookup the title history for an article via a background script proxy, instead of directly from the content script.
This is more secure and is not blocked by future CORB-policies, such as those already in place in Chrome 73. 
The version number will show up as 1.9.1 in browsers due to a certificate bug in Firefox disabling a previous release, forcing a .1 version increment.

- Switched out XMLHttpRequest API usage for the newer, more robust fetch API.
- Moved CORS request to background script.
- Added floris.amsterdam (HTTPS only) as allowed host.
- Properties in media.json are now lowercased as per best JSON-practices.

### OpenTitles 1.8 (21/4/2019)
NOS title selector changed

### OpenTitles 1.7 (19/3/2019)
Minor update to remove some broken feeds and add a few missing ones for NOS.

### OpenTitles 1.6 (23/1/2019)
Small definitions fix

### OpenTitles 1.5 (21/1/2019)
- Fixed window variable ID extraction for more than one property of window and added retries.

### OpenTitles 1.4 (19/1/2019)
Add two new ways to extract the article ID from a page: var and page. 
Previously the ID had to be included in the URL for the plugin to be able to match an article to our records, now it can also be extracted from a global/window JS variable or an element on the page.
This update also includes definitions for some of the largest US media

- Added two fields to media.json: PAGE_ID_LOCATION and PAGE_ID_QUERY to define where and how the ID can be extracted.
- Fixed media.json parser in server.js - this should be refactored into a more readable set of methods in the future.
- Additional logging and checks.
- ID extraction method and switch on client script.
- Added media:
  - https://\*.abcnews.go.com/*
  - https://\*.cbsnews.com/*
  - https://\*.cnn.com/*
  - https://\*.msnbc.com/*
  - https://\*.nytimes.com/*
  - https://\*.latimes.com/*
  - https://\*.usatoday.com/*
  - https://\*.wsj.com/*
  - https://\*.washingtonpost.com/*
  - https://\*.vice.com/*
  - https://\*.huffingtonpost.com/*
  - https://\*.tmz.com/*
  - https://\*.newsweek.com/*
  - http://\*.time.com/*
  - https://\*.theguardian.com/*
  - https://\*.reuters.com/*

### OpenTitles 1.3 (6/1/2019)
Make the popup look a bit more polished.

### OpenTitles 1.2 (6/1/2019)
Added important features that will make it a lot easier to start adding more media down the line.

- Use unified media definitions shared by the server and the extension. This way media only have to be defined in one file.
- Move the media definitions down one level in the JSON config so that they are now properties of a country (i.e. NL, US, DE, BE, etc.)
- Switch the extension to load this list instead of using an internal array of media.
- Add a popup with a form to suggest the current website to be tracked by the API.
- Add endpoints to the server to process these suggestions.

### OpenTitles 1.1 (8/12/2018)
Small compatiblity fix for Firefox's implementation of XMLHttpRequest

### OpenTitles 1.0 (8/12/2018)
Initial release