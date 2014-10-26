/*
  info ([member])
  
  Prints the info of the specified member or the current member if none is specified 
*/

var GroupWriter = require('../group-writer');
var util = require('../../lib/util');
var deferred = require('deferred');
var Player = require('../../model/player');

exports.exp = /^info(?:\s+(.+))?\s*$/i

exports.run = function(match, user, group) {
	var search = match[1];
	var engine = group.getEngine();
	var out = GroupWriter.create(group);
	
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

		if (promises.length == 0) promises.push(0);
		
		return deferred.apply(this, promises).then(function() {
			out.write(users.length+" member matches for '"+search+"':");
			users.forEach(function(u) {
				out.write(u.formatInfo());
				var ps = engine.getPlayers({ user: u });
				ps = ps.sort(Player.sortMembers);
				
				ps.forEach(function(p) {
					out.write(" &#8226; "+util.formatStats(p));
				});
			}); 
		}).then(function() {
			var ps = players.filter(function(p) { return pids.indexOf(p.uid) == -1; });
			ps = ps.sort(Player.sortMembers);
			
			out.write('\n'+ps.length+" player matches for '"+search+"':");
			ps.forEach(function(p) {
				out.write(util.formatStats(p));
			});
		}).then(function() {
			out.end();
		});
	} else {
		var str = user.name;
		var promises = [];
		
		if (user.location && user.location.length > 2) str += " (" + user.location + ")";
		out.write(str + ":");
		
		var players = engine.getPlayers({ user: user });
		
		if (players.length) {
			players.forEach(function(p) {
				promises.push(p.getStats(true));
			});
				
			deferred.apply(this, promises).then(function() {
				players.forEach(function(p) {
					out.write(util.formatStats(p)); 
				});
				
				out.end();
			});
		} else {
			var str = 'I don\'t who your characters are, please use the "ident"' +
					' command to set your characters name (don\'t forget the quotes)\nident "Alex"';
			out.print(str);
		}
	}
}

