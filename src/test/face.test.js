var mysql = require('mysql'),
	express = require('express'),
	Engine = require('../engine'),
	face = require('../chip.face');
	
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
});

var engine = Engine.create();

face.use(connection, engine);

var app = face.create('/home/evan/work/wbt-face');
app.listen(8777);
