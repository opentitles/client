module.exports = {
	apps: [
    {
    	name: 'OpenTitles API',
    	script: 'server.js',
			watch: ["server.js", "package.json", "config.json"]
    }
  ]
};
