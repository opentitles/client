<p align="center">
 <img src="https://raw.githubusercontent.com/Fdebijl/OpenTitles/master/images/header.png")/>
</p>

[Chrome](https://chrome.google.com/webstore/detail/opentitles/ipcpballelfolmocdhfjijgmbljachog) / [Mozzarella Firefox](https://addons.mozilla.org/en-GB/firefox/addon/opentitles/)

OpenTitles is a browser addon that currently tracks changes to over 40 news sites, such as nos.nl, nytimes.com and theguardian.com. It adds a button to the headlines on these sites. When clicked, this button will show all recent changes to the title of this article.

If you would like to contribute to the list of media being tracked, please check the [wiki](https://github.com/Fdebijl/OpenTitles/wiki) for instructions on formatting a news website for this list. If you can't be bothered to figure that out, you can simply click the extension icon when it's installed - a window will pop up with a form to suggest the website you're currently on should be tracked by OpenTitles.

'History' logo by Sugeng Santoso

### FAQ

**Why does Chrome say this extension needs to read my browser history?**
The '[tabs](https://developer.chrome.com/extensions/tabs)' permission is required for the popup to know which website you're looking at, so that it can tell whether the OpenTitles API is already tracking that website or not. This is the only part of the tabs API that is used by this plugin, it does not actually read your browser history (you may verify this by viewing ot_script.js in your installation).
