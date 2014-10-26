/*
	mystats (u[number]) ([level]) [attack] / [defense] ([mafia])
	
	Updates chips records of the current users stats
*/

var GroupWriter = require('../group-writer');
var Stats = require('../../model/stats');
var moment = require('moment');
var util = require('../../lib/util');

exports.exp = /^my ?stats\s*(?:u([0-9]))?\s*([0-9]{1,3})?\s+([0-9\.,]+)([km]?)\s*\/\s*([0-9\.,]+)([km]?)\s*([0-9]{1,3})?(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();

	if (user) {
		var players = engine.getPlayers({ user: user });
		var p;

		if (players.length <= 0) {
			gw.write("You don't appear to have any characters.  Use \"ident\" to add a character.");
		} else if (players.length == 1) {
			p = players[0];
		} else if (players.length >= match[1] && match[1] > 0) {
			p = players[match[1]-1];
		} else {
			gw.write('You have multiple accounts, please specify which one you are updating:');
			gw.write('mystats u2 28m / 24.07m');
			gw.write('         ^ user number here\n');
			
			players.forEach(function(p, i) {
				gw.write(i+1+') '+p.name);
			});
		}
		
		if (p) {
			return p.getStats(true).then(function() {
				var stats;
				
				if (!p.stats || moment().subtract(1, 'days').isAfter(p.stats.created)) {
					stats = Stats.create();
					stats.uid = p.uid;
					stats.private = true;
					
					if (p.stats && !stats.level) stats.level = p.stats.level;
					if (p.stats && !stats.mafia) stats.level = p.stats.mafia;
				} else {
					 stats = p.stats;
				}
				
				if (match[2])
					stats.level = match[2];
				
				stats.attack = util.parseStat(match[3], match[4]);
				stats.defense = util.parseStat(match[5], match[6]);
				
				if (match[7])
					stats.mafia = match[7];
				
				p.stats = stats;
				stats.save();
				
				/*
				var sheet = Sheet.gdoc(engine.sheetCreds);
				sheet.updateMember(user);
				*/
				
				gw.print('Updated stats: '+util.formatStats(p));
			});
		} else {
			gw.end();
		}
	} else {
		gw.print('Sorry, I\'m not not sure who you are');
	}
}
