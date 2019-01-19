### 1.4
Add two new ways to extract the article ID from a page: var and page. 
Previously the ID had to be included in the URL for the plugin to be able to match an article to our records, now it can also be extracted from a global/window JS variable or an element on the page.
This update also includes definitions for some of the largest US media

- Added two fields to media.json: PAGE_ID_LOCATION and PAGE_ID_QUERY to define where and how the ID can be extracted.
- Fixed media.json parser in server.js - this should be refactored into a more readable set of methods in the future.
- Additional logging and checks.
- ID extraction method and switch on client script.
- Added media:
  - "https://*.abcnews.go.com/*"
  - "https://*.cbsnews.com/*"
  - "https://*.cnn.com/*"
  - "https://*.msnbc.com/*"
  - "https://*.nytimes.com/*"
  - "https://*.latimes.com/*"
  - "https://*.usatoday.com/*"
  - "https://*.wsj.com/*"
  - "https://*.washingtonpost.com/*"
  - "https://*.vice.com/*"
  - "https://*.huffingtonpost.com/*"
  - "https://*.tmz.com/*"

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