var Promise = require('bluebird');
var mysql = require('mysql');
var Engine = require('./model/engine');
var Group = require('./model/group');
var Face = require('./face/face');
var Voice = require('./voice/voice');
var GroupWriter = require('./voice/group-writer');

var identStr = "Executing Self-Identification Protocol **0010110111001001**";

Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

var connection, engines = {}, groups = {}, debug = [], errors = [], identing = {};

exports.create = function(dbCreds, voice, face) {
	var self = this;
	
	connection = mysql.createConnection(dbCreds);
	connection.connect();
	exports.db = connection;
	
	// 5 mins
	setInterval(keepAlive, 1000*60*5);

	Engine.getAll().then(function(es) {
		es.forEach(function(e) {
			self.addEngine(e);
		});
	});
}

exports.addEngine = function(e) {
	engines[e.sid] = e;
	e.init();
}

exports.addGroup = function(group) {
	if (group.bot_id) {
		groups[group.groupme_id] = group;
	} else if (identing[group.groupme_id] === undefined) {
		identing[group.groupme_id] = group;
		var out = GroupWriter.create(group);
		out.print(identStr);
	} else {
		console.log('Rejecting: No id found, Already identing');
	}
}

exports.removeGroup = function(groupme_id) {
	delete groups[groupme_id];
}

exports.getGroup = function(groupmeId) {
	return groups[groupmeId];
}

exports.getEngine = function(sid) {
	return engines[sid];
}

exports.identifyGroup = function(msg) {
	var self = this;
	
	if (msg.text == identStr) {
		// If this group has sent an identification message, match the bot id
		var grp = identing[msg.group_id];
		
		if (grp) {
			grp.bot_id = msg.user_id;
			delete identing[msg.group_id];
			
			groups[grp.groupme_id] = grp;
			grp.getEngine().groups.push(grp);
			return grp.save();
		}
	} else {
		var grp = exports.getGroup(msg.group_id);
		
		if (grp) {
			// Registered group, resend identification
			identing[group.groupme_id] = grp;
			var out = GroupWriter.create(grp);
			out.print(identStr);	
		} else {
			// Message from an unregistered group.  See if we can attempt identification
			Group.getByGroupmeId(msg.group_id).then(function(group) {
				if (group) {
					self.log('Found group, executing identification');
					
					identing[group.groupme_id] = group;
					var out = GroupWriter.create(group);
					out.print(identStr);		
				} else {
					self.log('Unidentified group: '+msg.group_id+" - ("+msg.user_id+")"+msg.name+": "+msg.text);
				}
			});
		}
	}
}

exports.log = function(msg) {
	if (debug.length > 500)
		debug = debug.slice(0, 300);
	
	console.log(msg);
	debug.push(msg);
}

exports.getLog = debug;

exports.error = function(e) {
	if (errors.length > 500)
		errors = errors.slice(0, 300);
	
	console.log(e);
	errors.push(e);
}

function keepAlive() {
	if (connection) {
		connection.query('select 1', function(err, result) {
			if(err) return console.log(err);
		});
	}
}
