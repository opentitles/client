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