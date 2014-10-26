/*
	target
	
	Optimizes the active intel, only shows targets with the lowest defense values
*/

var GroupWriter = require('../group-writer');
var Player = require('../../model/player');
var util = require('../../lib/util');
var moment = require('moment');
var deferred = require('deferred');

exports.exp = /^targets?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	if (engine.battle && engine.battle.opponent) {
		var synd = engine.battle.opponent;

		return Player.getBySynd(synd).then(function(players) {
			var promises = [];
			var after = moment().subtract(5, 'days');
			
			players.forEach(function(p) {
				promises.push(p.getStats());
			});
			
			if  (promises.length == 0) promises = [ 0 ];
			
			return deferred.apply(this, promises).then(function() {
				players = players.filter(function(p) { return p.stats && after.isBefore(p.stats.created) });
				players.sort(function(a, b) {
					if (b.stats.level == a.stats.level)
						return a.stats.defense - b.stats.defense;
					 
					return b.stats.level - a.stats.level; 
				});
				
				if (players.length) {
					var lowDef = players[0].stats.defense + 1;
					
					players = players.filter(function(p) { 
						if (lowDef > p.stats.defense) {
							lowDef = p.stats.defense;
							return true;
						}
						
						return false;
					});
					
					gw.write('Optimized Targets for '+synd.name+' ('+players.length+' targets):\n');
					
					var online = [], promises = [];
			
					Object.keys(engine.battle.online).forEach(function(key) {
						var ps = engine.getPlayers({ user: engine.battle.online[key] });
						
						if (ps.length) {
							ps.forEach(function(p) {
								online.push(p);
								promises.push(p.getStats(true));
							});
						}
					});
			
					if (!promises.length) promises = [ 0 ];
			
					return deferred.apply(this, promises).then(function() {
						var i = 0;
						online = online.sort(function(a, b) { return b.stats.attack - a.stats.attack });
						
						players.forEach(function(p) {
							var line = util.formatStats(p);
							
							if (i < online.length && online[i].stats.attack * 0.8 > p.stats.defense) {
								line += " ← ";
								while (i < online.length && online[i].stats.attack * 0.8 > p.stats.defense) {
									line += online[i].name
									
									i++;
									if (i < online.length && online[i].stats.attack * 0.8 > p.stats.defense) line += ", ";
								}
							}
							
							gw.write(line);
						});
					});
				} else {
					gw.write("No recent intelligence");
				}
			});
		}).then(function() { gw.end(); });
	} else {
		gw.print("No active battles.");
	}
}
