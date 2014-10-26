var express = require('express');

exports.attachHandlers = function(face, rootPath) {
   require('./account')(face, rootPath);
    
	face.get('/news', function(req, res) {
		res.sendFile(rootPath + 'assets/static/news.html');
	});
	
	face.get('/commands', function(req, res) {
		res.sendFile(rootPath + 'assets/static/commands.html');
	});
	
	face.get('/register', function(req, res) {
		res.sendFile(rootPath + 'assets/static/register.html');
	});
	
	face.get('/gettingstarted', function(req, res) {
		res.sendFile(rootPath + 'assets/static/started.html');
	});
	
	face.get('/', function(req, res) {
		res.sendFile(rootPath + 'assets/static/main.html');
	});
	
	face.use("/assets", express.static(rootPath + "assets"));
};
