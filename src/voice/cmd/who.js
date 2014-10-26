/*
	who
	
	Prints members who have responded to the roll call check
*/

var GroupWriter = require('../group-writer');
var util = require('../../lib/util');
var deferred = require('deferred');
var Player = require('../../model/player');

exports.exp = /^who\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	if (engine.battle) {
		if (engine.battle.rcConf) {
			var attend = engine.getAttendance();
			
			if (attend.length) {
				gw.write("Roll Call Attendance:\n");
				var promises = [];
			
				attend.forEach(function(p) {
					promises.push(p.getStats(true))
				});
				
				deferred.apply(this, promises).then(function() {
					attend.forEach(function(p) {
						gw.write(util.formatStats(p));
					});
					
					gw.end() 
				});
			} else {
				gw.print("...crickets");
			}
		} else {
			var players = [], users = [], promises = [];
			
			Object.keys(engine.battle.online).forEach(function(key) {
				var u = engine.battle.online[key];
				var ps = engine.getPlayers({ user: u });
				
				if (ps.length) {
					ps.forEach(function(p) {
						players.push(p);
						promises.push(p.getStats(true));
					});
				} else {
					users.push(u);
				}
			});
			
			if (!promises.length) promises = [ 0 ];
			
			deferred.apply(this, promises).then(function() {
				players = players.sort(Player.sortMembers);
				gw.write('Online Members:');
				
				players.forEach(function(p) {
					if (p.stats) {
						gw.write(util.formatStats(p));
					} else {
						gw.write(p.name);
					}
				});
				users.forEach(function(u) {
					gw.write(u.formatInfo());
				});
			}).then(function() {
				gw.end();
			});
		}
	} else {
		gw.print("No active battle");
	}
}
