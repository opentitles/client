(() => {
  'use strict';

  const Parser = require('rss-parser');
  const parser = new Parser({
    headers: {'User-Agent': 'OpenTitles Scraper by floris@debijl.xyz'},
  });
  const moment = require('moment');
  const fs = require('fs');
  const express = require('express');
  const app = express();
  const cors = require('cors');
  const MongoClient = require('mongodb').MongoClient;
  const url = 'mongodb://localhost:27017/opentitles';
  const CONFIG = JSON.parse(fs.readFileSync('config.json'));

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

  setInterval(() => {
    retrieveArticles();
  }, CONFIG.SCRAPER_INTERVAL * 1000);

  /**
   * Iterate over all RSS feeds and check for each article if we've seen it already or not
   */
  async function retrieveArticles() {
    for (let i = 0; i < CONFIG.FEEDS.length; i++) {
      const SUBFEED = CONFIG.FEEDS[i];
      let orgfeed = {items: []};
      for (let j = 0; j < SUBFEED.FEEDS.length; j++) {
        const feedname = SUBFEED.FEEDS[j];
        let feed = await parser.parseURL(SUBFEED.PREFIX + feedname + SUBFEED.SUFFIX);

        feed.items = feed.items.map((item) => {
          item.artid = guidReducer(item[SUBFEED.ID_CONTAINER], SUBFEED.ID_MASK);
          item.org = SUBFEED.NAME;
          return item;
        });

        orgfeed.items.push(...feed.items);
      }

      removeDupesAndCheck(orgfeed);
    }
  }

  /**
   * Takes a fully populated feed from one org, removes the duplicates and passes it on to the database to check for new titles.
   * @param {object} feed The feed as retrieved by rss-parser - make sure artid and org are populated.
   */
  function removeDupesAndCheck(feed) {
    // Reduce feed items to unique ID's only
    let seen = {};
    feed.items = feed.items.filter((item) => {
      // Make sure we have an articleID and organisation
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
        let newEntry = {
          org: article.org,
          articleID: article.artid,
          link: article.link,
          titles: [{title: article.title, datetime: moment(article.pubDate).format('MMMM Do YYYY, h:mm:ss a')}],
          first_seen: moment().format('MMMM Do YYYY, h:mm:ss a'),
          pub_date: moment(article.pubDate).format('MMMM Do YYYY, h:mm:ss a'),
        };

        // console.log(`[${article.org}:${article.artid}] Added new article to collection`);

        dbo.collection('articles').insertOne(newEntry);
        return;
      }

      if (res && res.titles[res.titles.length - 1].title !== article.title) {
        // Article was already seen but we have a new title, add the latest title
        res.titles.push({title: article.title, datetime: moment().format('MMMM Do YYYY, h:mm:ss a')});
        dbo.collection('articles').replaceOne(find, res);
        // console.log(`[${article.org}:${article.artid}] New title added for article`);
        return;
      }

      // Article was seen, but the title hasn't changed
      // console.log(`[${article.org}:${article.artid}] Title unchanged`);
    });
  }

  /**
   * Find an article in the database for a given organisation and ID.
   * @param {object} find Object with org and articleid to query with the DB.
   * @param {function} callback Called once a result is found
   * @return {object} Returns the article if found, null if not found and [null] if an error occured.
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
      return res;
    });
  }

  /**
   * Reduce a given GUID (effectively a URL) to a full ID used for tracking the article.
   * @param {string} guid The GUID for this article.
   * @param {string} mask The regex mask to extract the ID with.
   * @return {string} The article ID contained within the GUID.
   */
  function guidReducer(guid, mask) {
    const matches = guid.match(mask);
    if (!matches) {
      return false;
    } else {
      return matches[0];
    }
  }

  // API Endpoints
  app.get('/opentitles/article/:org/:id', cors({credentials: true, origin: true}), function(req, res) {
    const artid = req.params.id;
    const artorg = req.params.org;

    if (!artid || !artorg || !artid.match(/[a-z0-9]+/)) {
      res.sendStatus(400);
      return;
    }

    const find = {
      org: artorg,
      articleID: artid,
    };

    dbo.collection('articles').findOne(find, function(err, article) {
      if (err) {
        console.error(err);
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(article, null, 4));
    });
  });

  app.listen(8083);
})();
