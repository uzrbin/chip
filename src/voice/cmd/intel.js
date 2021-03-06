/*
	intel ([syndicate])
	
	Prints current intel for the specified syndicate or 
		the active intel if none is specified and there is an active battle
*/

var GroupWriter = require('../group-writer');
var Syndicate = require('../../model/syndicate');
var User = require('../../model/user');
var Player = require('../../model/player');
var util = require('../../lib/util');
var deferred = require('deferred');
var moment = require('moment');

exports.exp = /^intel(?:\s+(.+?))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	if (match[1]) {
		Syndicate.find(match[1]).then(function(synds) {
			if (synds.length) {
				synd = synds[0];
				
				return Player.getBySynd(synd).then(function(players) {
					var promises = [];
					var after = moment().subtract(5, 'days');
					
					players.forEach(function(p) {
						promises.push(p.getStats());
					});
					
					if  (promises.length == 0) promises = [ 0 ];
					
					return deferred.apply(this, promises).then(function() {
						players = players.filter(function(p) { return p.stats && after.isBefore(p.stats.created) });
						players.sort(Player.sortIntel);
						
						if (players.length) {
							gw.write('Active Intel for '+synd.name+' ('+players.length+' reports):\n');
							
							players.forEach(function(p) {
								gw.write(util.formatStats(p));
							});
						} else {
							gw.write("No recent intelligence");
						}
					});
				}).then(function() { gw.end(); });
			} else {
				gw.print('Could not find syndicate: "'+match[1]+'"');
			};
		});
	} else {
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
					players.sort(Player.sortIntel);
					
					if (players.length) {
						gw.write('Active Intel for '+synd.name+' ('+players.length+' reports):\n');
						
						players.forEach(function(p) {
							gw.write(util.formatStats(p));
						});
					} else {
						gw.write("No recent intelligence");
					}
				});
			}).then(function() { gw.end(); });
		} else {
			gw.print("No active battles");
		}
	}
}
