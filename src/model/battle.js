var UserParser = require('../lib/user-parser');
var User = require('./user');
var Player = require('./player');
var Stats = require('./stats');
var util = require('../lib/util');
var moment = require('moment');
var chip = require('../chip');
var deferred = require('deferred');

exports.get = function(id) {
	return chip.db.queryAsync('SELECT * FROM battle WHERE bid=' + id).spread(function (result) {
		if (result.length == 1) {
			return new Battle(result[0]);
		}
	});
}

exports.getHistory = function(sid1, sid2) {
	return chip.db.queryAsync('SELECT * FROM battle WHERE sid1='+sid1+' AND sid2='+sid2).spread(function(result) {
		return result.map(function(b) { return new Battle(b); });
	});
}

exports.create = function(properties) {
	return new Battle(properties);
}

var Battle = function(properties) {
	this.targets = [];
	this.online = {};
	this.rcConf = null;
	this.opponent = null;
	
	util.extend(this, properties);
};

Battle.prototype.save = function() {
	if (this.sid1 && this.sid2) {
		var self = this,
			bat = {};
		
		bat.sid1 = this.sid1;
		bat.sid2 = this.sid2;
		
		bat.start = this.start;
		if (this.points1) bat.points1 = this.points1;
		if (this.points2) bat.points2 = this.points2;
		bat.confirmed = this.confirmed || false;
			
		if (this.bid) {
			var sql = 'UPDATE battle SET ? WHERE bid='+this.bid;
			return chip.db.queryAsync(sql, bat);
		} else {
			bat.created = new Date();
			var sql = 'INSERT INTO battle SET ?';
			return chip.db.queryAsync(sql, bat).then(function(result) {
				self.bid = result[0].insertId;
			});
		}
	} else {
		console.log('Not saving battle, requires both syndicates');
	}
}

Battle.prototype.setEnd = function(end) {
	this.start = moment(end).subtract(60, 'minutes').toDate();
}

Battle.prototype.getEnd = function() {
	if (this.start)
		return moment(this.start).clone().add(60, 'minutes').toDate();
		
	return null;
}

Battle.prototype.setOpponent = function(synd) {
	this.sid2 = synd.sid;
	this.opponent = synd;
}

Battle.prototype.addTargets = function(players) {
	Array.prototype.push.apply(this.targets, players);
}

Battle.prototype.addTarget = function(player) {
	this.targets.push(player);
}

Battle.prototype.parseIntel = function(txt) {
	var self = this;
//console.log('targeting', text)	
	if (this.sid2) {
		txt.split('\n').forEach(function(line) {
			var up = UserParser.create({ txt: line });
			var tar = up.parse();
			var promises = [];
			
			if (tar.name && tar.defense && tar.level) {	
				var p;
				
				// Find player
				return Player.findBySyndIdPlayer(self.sid2, tar).then(function(player) {					
					if (player) {
						p = player;
						return deferred(p);
					} else {
						// No player found, create one
						p = Player.create({
							sid: self.sid2,
							name: tar.name,
							search: util.getSearch(tar.name)
						});
						return p.save();
					}
				}).then(function() { return p.getStats(); }).then(function() {
					var stats;
					if (p.stats) {
						// Existing stats, if they're recent, update the record 
						if (moment().subtract(1, 'days').isAfter(p.stats.created)) {
							if (tar.defense > p.stats.defense) {
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
							stats = p.stats;
						}
					} else {
						// No existing stats - create
						stats = Stats.create({ uid: p.uid });
					}

					if (tar.level) stats.level = tar.level;
					if (tar.attack) stats.attack = tar.attack;
					stats.defense = tar.defense;
					stats.dl = tar.dl;
					return stats.save();
				});
			}
		});	
		
	}
}

/*
Battle.prototype.getOptimized = function() {
	var targets = [];

	this.targets.forEach(function (t) {
		var add = true;
		targets.forEach(function (optimal) {
			if (t.defense > optimal.defense)
				add = false;
		});

		if (add)
			targets.push(t);
	});

	return targets;
};



Battle.prototype.addMember = function(player) {
//console.log('adding ', players);
	var found = false;
		
	this.players.forEach(function(p) {
		if (player.uid == p.uid)
			found = true;
	});
		
	if (!found) {
		this.players.push(player);
//		console.log('added');

		this.players.sort(function(a, b) {
			return (b.attack - a.attack);
		});
	}
//console.log('new list', this.players);
}

Battle.prototype.addMembers = function(players) {
	var that = this;
//	console.log('adding members', players);
	this.players.forEach(function(player) { that.addMember(player); });
}
*/