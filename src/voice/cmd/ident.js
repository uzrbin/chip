/*
	ident "[player]"(,"[player]")...
	
	Matches the user with their players.
*/

var Player = require('../../model/player');
var GroupWriter = require('../group-writer');

exports.exp = /^ident\s+("[^"]*"[,\s]*)+\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	var nameExp = /"([^"]+)"/g;
	
	Player.unsetUser(user).then(function() {
		return engine.loadPlayers();
	}).then(function() {
		while(n = nameExp.exec(match[0])) {
			var nm = n[1];
			var players = engine.getPlayers({ search: nm });
			var p;
			
			players = players.filter(function(p) { return !p.pid });
			
			if (players.length) {
				// This gets dodgy I think with a lot of duplications, but we ignore that for now
				p = players[0];
				engine.debug('Member '+user.name+' matched to player '+p.name);
			} else {
				p = Player.create();
				p.name = nm;
				p.sid = user.sid;
				engine.debug('Member '+user.name+' created player '+p.name);
			}
			
			p.pid = user.pid;
			p.save().then(function() { engine.loadAll(); });
		}
	});
}
