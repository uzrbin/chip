var url = require('url');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var chip = require('../chip');
var User = require('../model/user');
var routes = require('./routes');

exports.create = function(rootPath) {
	var face = express();
	
	face.use(bodyParser.urlencoded({ extended: false }));
	face.use(cookieParser('randomsetofalphanumericishcharacters'));
	face.use(session({
		secret  : "There is a fish in a hat",
		maxAge  : new Date(Date.now() + 3600000), //1 Hour
		expires : new Date(Date.now() + 3600000) //1 Hour
	}));
	
	routes.attachHandlers(face, rootPath);
	return face;
}
