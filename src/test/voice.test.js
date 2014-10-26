var mysql = require('mysql'),
	express = require('express'),
	Voice = require('../voice');
	
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
});

Voice.use(connection);
var voice = Voice.create();

voice.listen(8080);
