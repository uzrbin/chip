var user = require('../user'),
	mysql = require('mysql');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
});

user.use(connection);

user.getMembers(function(members) {
	console.log('Found members: ' + members.length);
});

user.getBySynd(75, function(users) {
	console.log(users);
});
