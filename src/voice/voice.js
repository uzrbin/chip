var mysql = require('mysql');
var express = require('express');
var util = require('../lib/util');
var chip = require('../chip');
var User = require('../model/user');
var Player = require('../model/player');
var Stats = require('../model/stats');
var Group = require('../model/group');
var Syndicate = require('../model/syndicate');
var Engine = require('../model/engine');
var Battle = require('../model/battle');
var UserParser = require('../lib/user-parser');
var Sheet = require('../model/sheet');
var GroupWriter = require('./group-writer');
var moment = require('moment');
var deferred = require('deferred');

var commands = [ 
	require('./cmd/calc'),
	require('./cmd/end'),
	require('./cmd/help'),
	require('./cmd/hist'),
	require('./cmd/ident'),
	require('./cmd/info'),
	require('./cmd/intel'),
	require('./cmd/mystats'),
	require('./cmd/oldintel'),
	require('./cmd/result'),
	require('./cmd/reload'),
	require('./cmd/rollcall'),
	require('./cmd/score-update'),
	require('./cmd/start'),
	require('./cmd/status'),
	require('./cmd/stop'),
	require('./cmd/target'),
	require('./cmd/vs'),
	require('./cmd/who'),
	require('./cmd/import'),
	require('./cmd/load-results')
];

exports.create = function(app) {
	var voice = express();
	
	voice.use(function(req, resp) {
		var body = '', d = new Date();
		req.setEncoding('utf8');

		req.on('data', function (chunk) {
			body += chunk;
		})

		req.on('end', function () {
			var data = JSON.parse(body);
//console.log(data);
			var fromGroup = chip.getGroup(data.group_id);
			
			if (fromGroup) {
				var engine = chip.getEngine(fromGroup.sid);
				
				if (engine) {
					var automated = data.system || (fromGroup.bot_id && fromGroup.bot_id == data.user_id);
					
					if (!automated) {
						var user = engine.getUser({ groupme_id: data.user_id });
						var finished = false;
						
						checkName(engine, user, data.user_id, data.name).then(function() {
							user = engine.getUser({ groupme_id: data.user_id });
							engine.gotMessage(data, user, fromGroup);
							
							// Respond to commands
							if (data.text) {
								commands.forEach(function(cmd) {
									var matches = data.text.match(cmd.exp);
									
									if (matches) {
										cmd.run(matches, user, getGroup(data.text, fromGroup), data);
										finished = true;
									}
								});
								
								if (!finished && engine.battle) {
									if (fromGroup.scout && data.text.indexOf('*nointel*') == -1) {
										engine.battle.parseIntel(data.text);
									}
								}
							}
						})
					} else if (data.system) {
						// console.log(data);
					}
				} else {
					chip.log('No engine found for group: '+data.group_id);
				}
			} else {
				chip.identifyGroup(data);
			}
		})
		
		resp.writeHead(200, {"Content-Type": "text/plain"});
		resp.write("Hello World");
		resp.end();
	});
	
	return voice;
}

function getGroup(msg, fromGroup) {
	return fromGroup;
}

// Probably just engine, data
function checkName(engine, user, gmId, name) {
	var user = user;
	var msg = "";
	var def = deferred();
	
	var playerParser = UserParser.create({ txt: name });
	var player = playerParser.parse();
	if (player.defense && !player.attack) {
		player.attack = player.defense;
		delete player.defense;
	}
	
	if (!user) {
		var u = User.create();
		u.sid = engine.synd.sid;
		u.groupme_id = gmId;
		
		if (player.name) {
			// Name looks like a player.  Try to find it.
			u.name = player.name;
		} else {
			// Just a name, set it any ways
			u.name = name;
		}
		
		engine.debug("Created member "+name+"\n");
		user = u;
		engine.users.push(u);
		return u.save().then(function(u) {
			def.resolve(user);
		});
	} else {
		def.resolve(user)
	}
	
	return def.promise.then(function(user) {
		// See if their name matches any players
		// Start with players that belong to them already
		var currPlayers = engine.getPlayers({ user: user });
		var matchedPlayer = currPlayers.find(function(p) {
			return util.getSearch(p.name).indexOf(util.getSearch(player.name)) > -1 ||
					util.getSearch(p.name).indexOf(util.getSearch(name)) > -1;
		});
		
			
		// We matched an existing player owned by this user by name
		if (matchedPlayer) {
			return matchedPlayer.getStats(true).then(function() {
				var stats, updated = false;
				
				if (matchedPlayer.stats) {
					stats = matchedPlayer.stats;
					
					if (player.attack > matchedPlayer.stats.attack) {
						updated = true;
						
						if (moment().subtract(1, 'days').isAfter(matchedPlayer.stats.created)) {
							// Mark for insertion
							delete stats.stats_id;
							delete stats.created;
						}
					}
				} else {
					updated = true;
					
					stats = Stats.create({
						uid: matchedPlayer.uid,
						private: true
					});
				}
				
				if (updated && player.attack) {
					if (player.level) stats.level = player.level;
					if (player.mafia) stats.mafia = player.mafia;
					if (player.attack) stats.attack = player.attack;
					if (player.defense) stats.defense = player.defense;
					
					return stats.save().then(function() {
						matchedPlayer.stats = stats;
						engine.debug("Updated stats for "+util.formatStats(matchedPlayer));
						//engine.loadPlayers();
					});
				}
			});
		}
		
		// Try to find an existing unowned player by name
		var mps = engine.getPlayers({ search: name });
		mps = mps.filter(function(p) {
			// But don't include other peoples players
			return p.pid == null && p.name == player.name; 
		});
		
		if (mps.length) {
			// Randomly take the first one
			var p = mps[0];
			p.pid = user.pid;
			engine.debug("Member "+user.name+" matched to player "+p.name+"\n");
			return p.save();
		}
		
		// Couldn't find any good matches by name.  Does this look like a set of stats?
		if (player.name && player.attack && player.level) {
			var p = Player.create(player);
			p.pid = user.pid;
			p.sid = user.sid;
			
			return p.save().then(function(p) {
				engine.debug("Member "+user.name+" added player "+p.name+"\n");
				engine.players.push(p);
				var stats = Stats.create(player);
				stats.uid = p.uid;
				stats.private = true;
				return stats.save();
			});
		}
	});
}

