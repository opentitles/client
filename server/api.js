(() => {
  'use strict';

  const moment = require('moment');
  const express = require('express');
  const app = express();
  const cors = require('cors');
  const MongoClient = require('mongodb').MongoClient;
  const url = 'mongodb://localhost:27017/opentitles';

  app.use(express.json());
  app.use(cors({credentials: true, origin: true}));

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

  // API Endpoints
  app.get('/opentitles/article/:org/:id', function(req, res) {
    const artid = decodeURIComponent(req.params.id);
    const artorg = decodeURIComponent(req.params.org);

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

  app.post('/opentitles/suggest', function(req, res) {
    res.end();

    let bod = req.body;
    if (typeof(bod) !== 'object') {
      bod = JSON.parse(bod);
    }

    if (!bod.url) {
      return;
    }

    const find = {
      url: bod.url,
    };

    dbo.collection('suggestions').findOne(find, function(err, suggestion) {
      if (err) {
        console.error(err);
        return;
      }

      if (!suggestion) {
        const newentry = {
          url: bod.url,
          rss_present: bod.hasrss,
          rss_overview: bod.rss_overview,
          has_id: bod.has_id,
          datetime: moment().format('MMMM Do YYYY, h:mm:ss a'),
        };

        dbo.collection('suggestions').insertOne(newentry);
      }
    });
  });

  app.get('/opentitles/suggest', function(req, res) {
    dbo.collection('suggestions').find({}).toArray(function(err, suggestions) {
      if (err) {
        console.error(err);
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(suggestions, null, 4));
    });
  });

  app.all('/opentitles/ping', function(req, res) {
    res.sendStatus(200);
  });

  app.listen(8083);
})();
