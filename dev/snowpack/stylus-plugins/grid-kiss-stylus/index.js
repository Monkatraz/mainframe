const
	postcss = require('postcss'),
	main    = require('./main');

module.exports = postcss.plugin('postcss-grid-kiss-nested', main);