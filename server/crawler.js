(() => {
  'use strict';

  const parsertimeout = 5;
  const parsermaxredirects = 5;
  const mongotimeout = 5;

  const fs = require('fs');
  const moment = require('moment');
  const request = require('request');
  const async = require('async');
  const MongoClient = require('mongodb').MongoClient;
  const Parser = require('rss-parser');

  const url = 'mongodb://127.0.0.1:27017/opentitles';
  const parser = new Parser({
    headers: {'User-Agent': 'OpenTitles Scraper by floris@debijl.xyz'},
    timeout: parsertimeout * 1000,
    maxRedirects: parsermaxredirects,
    customFields: {
      item: ['wp:arc_uuid'],
    },
  });
  const listeners = [
    {
      name: 'NOSEdits',
      interestedOrgs: ['NOS'],
      webhookuri: 'http://127.0.0.1:7676/notify',
    },
  ];

  if (!fs.existsSync('media.json')) {
    throw new Error('Media.json could not be found in the server directory.');
  } const config = JSON.parse(fs.readFileSync('media.json'));

  let dbo;

  /**
   * Connect once and use the dbo reference in every call from here on out
   */
  MongoClient.connect(url, {
    appname: 'OpenTitles API',
    useNewUrlParser: true,
    connectTimeoutMS: mongotimeout * 1000,
  }).then((client) => {
    dbo = client.db('opentitles');
  }).catch((err) => {
    throw err;
  });

  /**
   * Iterate over all RSS feeds and check for each article if we've seen it already or not
   */
  function retrieveArticles() {
    // console.log('Starting retrieve articles.');
    Object.entries(config.feeds).forEach((country) => {
      const countrycode = country[0];
      const media = country[1];

      async.forEachSeries(media, (medium, nextMedium) => {
        let mediumfeed = {items: []};

        async.forEachSeries(medium.feeds, (feedname, nextFeed) => {
          parser.parseURL(medium.prefix + feedname + medium.suffix)
              .then((feed) => {
                feed = processFeed(feed, medium, feedname, countrycode);
                mediumfeed.items.push(...feed.items);
                nextFeed();
              })
              .catch((err) => {
                // console.log(`Could not retrieve ${medium.prefix + feedname + medium.suffix}`);
                nextFeed();
              });
        }, (err) => {
          // Callback function once all feeds are processed.
          if (err) {
            // Something went wrong when retrieving the feeds.
            console.error(err);
            return;
          }

          mediumfeed = deduplicate(mediumfeed);
          checkAndPropagate(mediumfeed);

          nextMedium();
        });
      }, (err) => {
        // Callback function once all media are processed.
        if (err) {
          // One the medium failed to process, do something here.
          console.error(err);
        }
      });
    });
  }

  /**
   * Match a guid to each item for the subfeed and check for empty/invalid entries.
   * @param {object} feed The subfeed as retrieved by rss-parser - make sure artid and org are populated.
   * @param {object} medium The medium as defined in media.json
   * @param {string} feedname The name of feed, which will be injected in the article.
   * @param {string} countrycode The ISO 3166-1 Alpha-2 countrycode as defined in media.json
   * @return {object} The feed with all extra variables injected and empty/invalid entries removed.
   */
  function processFeed(feed, medium, feedname, countrycode) {
    feed.items = feed.items.map((item) => {
      item.artid = guidReducer(item[medium.id_container], medium.id_mask);

      if (!item.artid) {
        return false;
      }

      item.title = item.title.trim();
      item.org = medium.name;
      item.feedtitle = feed.title;
      item.sourcefeed = feedname;
      item.lang = countrycode;
      return item;
    });

    // Remove articles for which no guid exists or none was found
    feed.items = feed.items.filter(Boolean);
    return feed;
  }

  /**
   * Takes a fully populated feed from one medium and removes the duplicates.
   * @param {object} feed The orgfeed as retrieved by rss-parser - make sure artid and org are populated.
   * @return {object} The mediumfeed without any duplicate entries.
   */
  function deduplicate(feed) {
    // Reduce feed items to unique ID's only
    const seen = {};

    feed.items = feed.items.filter((item) => {
      // Make sure required variables are present
      if (!item.artid || !item.org) {
        return false;
      }

      return seen.hasOwnProperty(item.artid) ? false : (seen[item.artid] = true);
    });

    return feed;
  }

  /**
   * Send every item to be checked by the DB.
   * @param {object} feed The orgfeed as retrieved by rss-parser - make sure artid and org are populated.
   */
  function checkAndPropagate(feed) {
    feed.items.forEach((item) => {
      checkWithDB(item);
    });

    feed = null;
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
        // console.log(`[${article.org}:${article.artid}] Not found in db`);
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
          titles: [{title: article.title, datetime: moment(article.pubDate).format('MMMM Do YYYY, h:mm:ss a'), timestamp: moment.now()}],
          first_seen: moment().format('MMMM Do YYYY, h:mm:ss a'),
          pub_date: moment(article.pubDate).format('MMMM Do YYYY, h:mm:ss a'),
        };

        // console.log(`[${article.org}:${article.artid}] Added new article to collection`);

        dbo.collection('articles').insertOne(newEntry);
        return;
      }

      if (res && res.titles[res.titles.length - 1].title !== article.title) {
        // Article was already seen but we have a new title, add the latest title
        res.titles.push({title: article.title, datetime: moment().format('MMMM Do YYYY, h:mm:ss a'), timestamp: moment.now()});
        dbo.collection('articles').replaceOne(find, res);
        // console.log(`[${article.org}:${article.artid}] New title added for article`);
        notifyListeners(res);
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
        // console.log(`[${moment().format('DD/MM/Y - HH:mm:ss')}] ${err}`);
        if (typeof(callback) == 'function') {
          callback([null]);
        }
        return [null];
      }

      if (typeof(callback) == 'function') {
        callback(res);
        return res;
      }
    });
  }

  /**
   * Reduce a given GUID (usually a URL) to a full ID used for tracking the article.
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
   * Notify all defined listeners that the title for an article has changed.
   * @param {Object} article The article object.
   */
  function notifyListeners(article) {
    if (!article.org || !article.articleID) {
      return;
    }

    if (listeners.length === 0) {
      return;
    }

    listeners.forEach((listener) => {
      if (listener.interestedOrgs.includes(article.org)) {
        request.post({
          uri: listener.webhookuri,
          json: true,
          body: article,
        }, function(err, httpResponse, body) {
          if (err) {
            console.log(`[${moment().format('DD/MM/Y - HH:mm:ss')}] Could not reach ${listener.name} when issuing webhook.`);
          } else {
            console.log(`[${moment().format('DD/MM/Y - HH:mm:ss')}] Reached ${listener.name} for [${article.org}:${article.articleID}].`);
          }
        });
      }
    });

    return;
  }

  setInterval(() => {
    retrieveArticles();
  }, config.scraper_interval * 1000);
})();
