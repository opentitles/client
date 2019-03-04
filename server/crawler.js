(() => {
  'use strict';

  const Parser = require('rss-parser');
  const parser = new Parser({
    headers: {'User-Agent': 'OpenTitles Scraper by floris@debijl.xyz'},
    timeout: 10 * 1000,
    maxRedirects: 25,
    customFields: {
      item: ['wp:arc_uuid'],
    },
  });
  const moment = require('moment');
  const request = require('request');
  const fs = require('fs');
  const MongoClient = require('mongodb').MongoClient;
  const url = 'mongodb://localhost:27017/opentitles';

  const listeners = [
    {
      name: 'NOSEdits',
      interestedOrgs: ['NOS'],
      webhookuri: 'http://127.0.0.1:7676/notify',
    },
  ];

  if (!fs.existsSync('media.json')) {
    throw new Error('Media.json could not be found in the server directory.');
  } const CONFIG = JSON.parse(fs.readFileSync('media.json'));

  let dbo;

  /**
   * Connect once and use the dbo reference in every call from here on out
   */
  MongoClient.connect(url, {
    appname: 'OpenTitles API',
    useNewUrlParser: true,
    connectTimeoutMS: 5000,
  }, function(err, database) {
    if (err) {
      throw err;
    }

    dbo = database.db('opentitles');
  });

  setTimeout(() => {
    retrieveArticles();
  }, 5000);

  setInterval(() => {
    retrieveArticles();
  }, CONFIG.SCRAPER_INTERVAL * 1000);

  /**
   * Iterate over all RSS feeds and check for each article if we've seen it already or not
   */
  async function retrieveArticles() {
    for (const countrykey in CONFIG.FEEDS) {
      if (CONFIG.FEEDS.hasOwnProperty(countrykey)) {
        const countryfeeds = CONFIG.FEEDS[countrykey];
        for (let i = 0; i < countryfeeds.length; i++) {
          const org = countryfeeds[i];
          const orgfeed = {items: []};
          for (let j = 0; j < org.FEEDS.length; j++) {
            const feedname = org.FEEDS[j];
            const [err, feed] = await to(parser.parseURL(org.PREFIX + feedname + org.SUFFIX));

            if (err) {
              console.log(`Could not retrieve ${org.PREFIX + feedname + org.SUFFIX}`);
              continue;
            }

            feed.items = feed.items.map((item) => {
              item.artid = guidReducer(item[org.ID_CONTAINER], org.ID_MASK);

              if (!item.artid) {
                return false;
              }

              item.org = org.NAME;
              item.feedtitle = feed.title;
              item.sourcefeed = feedname;
              item.lang = countrykey;
              return item;
            });

            // Remove articles for which no guid exists or none was found
            feed.items = feed.items.filter(Boolean);

            orgfeed.items.push(...feed.items);
          }

          removeDupesAndCheck(orgfeed);
        }
      }
    }
  }

  /**
   * Takes a fully populated feed from one org, removes the duplicates and passes it on to the database to check for new titles.
   * @param {object} feed The feed as retrieved by rss-parser - make sure artid and org are populated.
   */
  function removeDupesAndCheck(feed) {
    // Reduce feed items to unique ID's only
    const seen = {};
    feed.items = feed.items.filter((item) => {
      // Required variables
      if (!item.artid || !item.org) {
        return false;
      }

      return seen.hasOwnProperty(item.artid) ? false : (seen[item.artid] = true);
    });

    feed.items.forEach((item) => {
      checkWithDB(item);
    });
  }

  /**
   * Check with the database if the given article exists and update the title if we have a new one.
   * @param {object} article An item as specified in the RSS standard, containing atleast the articleid and org.
   */
  function checkWithDB(article) {
    const find = {
      org: article.org,
      articleID: article.artid,
    };

    findArticle(find, (res) => {
      if (res === [null]) {
        return;
      }

      if (!res) {
        // Does not exit yet in DB
        const newEntry = {
          org: article.org,
          articleID: article.artid,
          feedtitle: article.feedtitle,
          sourcefeed: article.sourcefeed,
          lang: article.lang,
          link: article.link,
          guid: article.guid,
          titles: [{title: article.title, datetime: moment(article.pubDate).format('MMMM Do YYYY, h:mm:ss a')}],
          first_seen: moment().format('MMMM Do YYYY, h:mm:ss a'),
          pub_date: moment(article.pubDate).format('MMMM Do YYYY, h:mm:ss a'),
        };

        console.log(`[${article.org}:${article.artid}] Added new article to collection`);

        dbo.collection('articles').insertOne(newEntry);
        return;
      }

      if (res && res.titles[res.titles.length - 1].title !== article.title) {
        // Article was already seen but we have a new title, add the latest title
        res.titles.push({title: article.title, datetime: moment().format('MMMM Do YYYY, h:mm:ss a')});
        dbo.collection('articles').replaceOne(find, res);
        console.log(`[${article.org}:${article.artid}] New title added for article`);
        notifyListeners(article);
        return;
      }

      // Article was seen, but the title hasn't changed
      // console.log(`[${article.org}:${article.artid}] Title unchanged`);
    });
  }

  /**
   * Find an article in the database for a given organisation and ID.
   * Returns the article if found, null if not found and [null] if an error occured.
   * @param {object} find Object with org and articleid to query with the DB.
   * @param {function} callback Called once a result is found
   */
  function findArticle(find, callback) {
    dbo.collection('articles').findOne(find, function(err, res) {
      if (err) {
        console.log(err);
        if (typeof(callback) == 'function') {
          callback([null]);
        }
        return [null];
      }

      if (typeof(callback) == 'function') {
        callback(res);
      }
    });
  }

  /**
   * Reduce a given GUID (effectively a URL) to a full ID used for tracking the article.
   * @param {string} guid The GUID for this article.
   * @param {string} mask The regex mask to extract the ID with.
   * @return {string} The article ID contained within the GUID.
   */
  function guidReducer(guid, mask) {
    if (!guid) {
      return false;
    }

    const matches = guid.match(mask);
    if (!matches) {
      return false;
    } else {
      return matches[0];
    }
  }

  /**
   * Await a promise and return its error if one occurs.
   * @param {Promise} promise
   * @return {[String, Promise]} An error (null if none occurred) and the result of the promise.
   */
  function to(promise) {
    return promise.then((data) => {
      return [null, data];
    })
        .catch((err) => [err]);
  }

  /**
   * Notify all defined listeners that the title for an article has changed.
   * @param {Object} article The article object.
   */
  function notifyListeners(article) {
    listeners.forEach((listener) => {
      if (listener.interestedOrgs.includes(article.org)) {
        request.post({
          uri: listener.webhookuri,
          json: true,
          body: article,
        }, function(err, httpResponse, body) {
          if (err) {
            console.log(`Could not reach ${listener.name} when issuing webhook.`);
          }
        });
      }
    });
  }
})();
