var syndicate = require('../syndicate'),
	mysql = require('mysql');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
});

syndicate.use(connection);

syndicate.search('Amsterdam Crime', function(synd) {
	console.log(synd);
});
