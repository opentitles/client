module.exports = {
  apps: [
    {
      name: 'OpenTitles Crawler',
      script: 'crawler.js',
      watch: ['crawler.js', 'package.json', 'media.json'],
    },
    {
      name: 'OpenTitles API',
      script: 'api.js',
      watch: ['api.js', 'package.json', 'media.json'],
    },
  ],
};
