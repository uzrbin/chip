/*
	vs [syndicate]
	
	Start a battle with specified syndicate.  Prints result history, previous match results, and intel
*/

var GroupWriter = require('../group-writer');
var Battle = require('../../model/battle');
var Syndicate = require('../../model/syndicate');
var Rank = require('../../model/rank');
var Player = require('../../model/player');
var moment = require('moment');
var deferred = require('deferred');
var util = require('../../lib/util');

exports.exp = /^vs(?:\s+(.+?))??(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	var self = this;
	
	if (!engine.battle)
		engine.battle = Battle.create({ sid1: engine.synd.sid });
	
	if (engine.battle.synd2) {
		gw.print("Opponent already set.  Start a new battle with \"start\"");
	} else {
		Syndicate.find(match[1]).then(function(synds) {
			if (synds.length == 1) {
				var promises = [], eventRanks = [], synd = synds[0];
				
				// Start the battle
				engine.startBattle(synd);
				gw.write('At war with '+synd.name+"\n");
				
				synd.writeRanks(gw).then(function() {
					return Battle.getHistory(engine.synd.sid, synd.sid);
				}).then(function(matches) {
					// Print match history
					if (matches && matches.length) {
						matches = matches.sort(function(m1, m2) { return m2.created - m1.created });
						matches = matches.slice(0, Math.min(matches.length, 3));
						gw.write('\nPast Matches:\n');
						
						matches.forEach(function(m) {
							gw.write('['+(m.points1>m.points2?'WON]  ':'LOST] ')+moment(m.created).calendar()+': '
									+util.formatStat(m.points1)+' - '+util.formatStat(m.points2));
						});
					} else {
						gw.write("\nNo match history\n");
					}
				}).then(function() {
					return Player.getBySynd(synd);
				}).then(function(players) {
					// Load and Print intel
					if (players && players.length) {
						var chain = deferred(""), playerStats = [];
						var after = moment().subtract(5, 'days');
						
						players.forEach(function(p) {
							chain = chain.then(function() { return p.getStats(); }).then(function(stats) {
								if (stats && after.isBefore(stats.created)) {
									playerStats.push({ player: p, stats: stats });
								}
							});
						});
						
						return chain.then(function() {
							playerStats.sort(Player.sortIntel);
							
							if (playerStats.length) {
								gw.write('\nActive Intel ('+playerStats.length+' reports):\n');
								
								playerStats.forEach(function(ps) {
									engine.battle.addTarget(ps.player);
									gw.write(util.formatStats(ps.player, ps.stats));
								});
							} else {
								gw.write("\nNo recent intelligence\n");
							}
						});
					} else {
						gw.write("\nNo intelligence found\n");
					}
				}).then(function() { gw.end(); });
			} else {
				gw.print("Syndicate not found");
			}
		});
	}
}
