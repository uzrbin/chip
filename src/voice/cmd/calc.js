/**
 calc ([member|math])
 
 Prints safe defense value and safe PA defense value for the specified member, 
 		or the current member if none is specified
 		
 Prints the result of the given math expression 
 */

var GroupWriter = require('../group-writer');
var util = require('../../lib/util');
var deferred = require('deferred')

exports.exp = /^calc(?:\s+(.+?))??(?:\s+([a-z]{2}))?\s*$/i,

exports.run = function(match, user, group) {	
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	var search = match[1];

	if (search) {
		var users = engine.getUsers({ search: search });
		var players = engine.getPlayers({ search: search });
		var promises = [], pids = [];
		
		users.forEach(function(u) {
			var ps = engine.getPlayers({ user: u });
			ps.forEach(function(p) {
				pids.push(p.uid);
				promises.push(p.getStats(true));
			});
		});
		
		players.forEach(function(p) {
			promises.push(p.getStats(true));
		});

		if (promises.length == 0) {
			// No players found, try doing math
			var mathExp = /^[\d\s\.\+\-\*\/\^]+$/
			var math = match[1].match(mathExp);
			
			try {
				if (math) {					
					gw.print(search + ' = ' + eval(match[1]));
				} else {
					gw.print('I\'m not sure how to count that');
				}
			} catch (e) {
				console.log('Error counting things', e);
			}
		} else {
			// We found some players
			return deferred.apply(this, promises).then(function() {
				gw.write(users.length+" member matches for '"+search+"':");
				users.forEach(function(u) {
					gw.write(u.formatInfo());
					var ps = engine.getPlayers({ user: u });
					ps.forEach(function(p) {
						if (p.stats && p.stats.attack) {
							gw.write(' &#8226; Safe defense for '+p.name+' is '+util.formatStat(p.stats.attack*0.8)+
									' ('+util.formatStat(p.stats.attack*1.2)+')');
						} else {
							gw.write('No attack value found for '+p.name);
						}
					});
				}); 
			}).then(function() {
				var ps = players.filter(function(p) { return pids.indexOf(p.uid) == -1; });
				
				gw.write('\n'+ps.length+" player matches for '"+search+"':");
				ps.forEach(function(p) {
					if (p.stats && p.stats.attack) {
						gw.write('Safe defense for '+p.name+' is '+util.formatStat(p.stats.attack*0.8)+
								' ('+util.formatStat(p.stats.attack*1.2)+')');
					} else {
						gw.write('No attack value found for '+p.name);
					}
				});
				
				gw.end();
			});
		}
	} else {
		var players = engine.getPlayers({ user: user });
		var promises = [];
		
		if (players.length) {
			players.forEach(function(p) {
				promises.push(p.getStats(true));
			});
			
			deferred.apply(this, promises).then(function() {
				players.forEach(function(p) {
					gw.write('Safe defense for '+p.name+' is '+util.formatStat(p.stats.attack*0.8)+
							' ('+util.formatStat(p.stats.attack*1.2)+')');
				})
			}).then(function() { gw.end(); });
		} else {
			gw.print('Sorry, I don\'t who your characters are, please use the "ident" command');
		}
	}
}
