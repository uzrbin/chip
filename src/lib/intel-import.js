var chip = require('../chip');
var Sheet = require('../model/sheet');
var Syndicate = require('../model/syndicate');
var Player = require('../model/player');
var Stats = require('../model/stats');
var UserParser = require('./user-parser');
var util = require('./util');
var deferred = require('deferred');
var moment = require('moment');

var sheetId = 3;
var sheetId2 = 4;

exports.run = function() {
	console.log('importing');

	return Sheet.get(sheetId).then(function(sheet) {
		return sheet.book.authorize().then(function() {
			return sheet.getRows();
		}).then(function(rows) {
			var chain = deferred(0);
			
			rows.forEach(function(row) {
				chain = chain.then(function() {
					Syndicate.find(row.nameofscoutedsyndicate).then(function(synds) {
						if (synds.length <= 0) {
							// TODO try looser matching
							return null;
						} else if (synds.length == 1) {
							return synds[0];
						} else {
							// TODO find the best match... but for now...
							return synds[0];
						}
					}).then(function(synd) {
						if (synd) {
							row.intelofscoutedsyndicate.split('\n').forEach(function(intel) {
								if (intel) {
									var intel = intel.trim();
									if (intel.length > 0) {
										var up = UserParser.create({ txt: intel });
										var plr = up.parse();
										
										if (plr.name && plr.defense && plr.level) {	
											var p;
										
											// Find player
											return Player.findBySyndIdPlayer(synd.sid, plr).then(function(player) {					
												if (player) {
													p = player;
													return deferred(p);
												} else {
													// No player found, create one
													p = Player.create({
														sid: synd.sid,
														name: plr.name,
														search: util.getSearch(plr.name)
													});
													return p.save();
												}
											}).then(function() { return p.getStats(); }).then(function() {
												var stats;
												if (p.stats) {
													// Existing stats, if they're recent, update the record 
													if (moment().subtract(1, 'days').isAfter(p.stats.created)) {
														if (plr.defense > p.stats.defense) {
															// Add a new stat entry if there is no recent one, and stats have increased
															stats = Stats.create(p.stats);
															delete stats.stats_id;
															delete stats.created;
														} else {
															// Old stats with same defense, discard
															return;
														}
													} else {
														// New stats, update
														stats = Stats.create(util.extend(p.stats, plr));
													}
												} else {
													// No existing stats - create
													stats = Stats.create(util.extend(plr, { uid: p.uid }));
												}
							
												if (plr.level) stats.level = plr.level;
												if (plr.attack) stats.attack = plr.attack;
												stats.defense = plr.defense;
												return stats.save();
											});
										}
									}
								}
							});		
						} else {
							console.log('could not find syndicate ', row.nameofscoutedsyndicate);
						}
					});
				});
			});
			
			return chain;
		});
	}).then(function() {
		return Sheet.get(sheetId2).then(function(sheet) {
			return sheet.book.authorize().then(function() {
				return sheet.getRows();
			}).then(function(rows) {
				var chain = deferred(0);
				
				rows.forEach(function(row) {
					chain = chain.then(function() {
						return Syndicate.find(row.team).then(function(synds) {
							if (synds.length <= 0) {
								// TODO try looser matching
								return null;
							} else if (synds.length == 1) {
								return synds[0];
							} else {
								// TODO find the best match... but for now...
								return synds[0];
							}
						}).then(function(synd) {
							if (synd) {
								row.stats.split('\n').forEach(function(intel) {
									if (intel) {
										var intel = intel.trim();
										if (intel.length > 0) {
											var up = UserParser.create({ txt: intel });
											var plr = up.parse();
											
											if (plr.name && plr.defense && plr.level) {	
												var p;
											
												// Find player
												return Player.findBySyndIdPlayer(synd.sid, plr).then(function(player) {					
													if (player) {
														p = player;
														return deferred(p);
													} else {
														// No player found, create one
														p = Player.create({
															sid: synd.sid,
															name: plr.name,
															search: util.getSearch(plr.name)
														});
														return p.save();
													}
												}).then(function() { return p.getStats(); }).then(function() {
													var stats;
													if (p.stats) {
														// Existing stats, if they're recent, update the record 
														if (moment().subtract(1, 'days').isAfter(p.stats.created)) {
															if (plr.defense > p.stats.defense) {
																// Add a new stat entry if there is no recent one, and stats have increased
																stats = Stats.create(p.stats);
																delete stats.stats_id;
																delete stats.created;
															} else {
																// Old stats with same defense, discard
																return;
															}
														} else {
															// New stats, update
															stats = Stats.create(util.extend(p.stats, plr));
														}
													} else {
														// No existing stats - create
														stats = Stats.create(util.extend(plr, { uid: p.uid }));
													}
								
													if (plr.level) stats.level = plr.level;
													if (plr.attack) stats.attack = plr.attack;
													stats.defense = plr.defense;
													return stats.save();
												});
											}
										}
									}
								});		
							} else {
								console.log('could not find syndicate ', row.team);
							}
						});
					});
				});
				
				return chain;
			});
		})
	}).then(function() {
		console.log('intel import finished');
	});
}
