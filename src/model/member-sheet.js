var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');
var Sheet = require('./sheet');
var Player = require('./player');
var Syndicate = require('./syndicate');
var Stats = require('./stats');
var Promise = require('bluebird');
var moment = require('moment');

require('array.prototype.find');

exports.getBySynd = function(synd) {
	var sql = "SELECT * FROM member_sheet WHERE sid="+synd.sid;

	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(ms) { return new MemberSheet(ms); });
	});
}

var MemberSheet = function(properties) {
	util.extend(this, properties);
}

MemberSheet.prototype.getSheet = function() {
	return Sheet.get(this.sheet_id);
}

MemberSheet.prototype.importMembers = function(synd) {
	var self = this, promises = [], oldPlayerIds = [], safePlayerIds = [];
	
	return this.getSynd().then(function(synd) { return Player.getBySynd(synd); }).then(function(players) {
		players.forEach(function(p) {
			promises.push(p.getStats(true));
			oldPlayerIds.push(p.uid);
		})
		
		return deferred(promises).then(function() {
			return self.getSheet();
		}).then(function(s) {
			return s.book.authorize().then(function() {
				return s.getSheet();
			}).then(function(sheet) {
				Promise.promisifyAll(sheet);
				return sheet.getRowsAsync();
			}).then(function(rows) {
				rows.forEach(function(row) {
					if (player = players.find(function(p) { 
						return util.getSearch(row.membername) == util.getSearch(p.name); 
					})) {
						safePlayerIds.push(player.uid);
						
						var stats;
						if (!player.stats || 
									(	row.defense && 
										moment().subtract(1, 'days').isAfter(player.stats.created) &&
										player.stats.defense < row.defense
									)
								) {
							stats = Stats.create();
							stats.uid = player.uid;
							stats.private = true;
							
							if (player.stats && !stats.level) stats.level = player.stats.level;
							if (player.stats && !stats.mafia) stats.level = player.stats.mafia;
						} else {
							 stats = player.stats;
						}
						
						if (row.level) stats.level = row.level;
						if (row.mafia) stats.mafia = row.mafia;
						if (row.attack) stats.attack = row.attack;
						if (row.defense) stats.defense = row.defense;
						
						player.stats = stats;
						stats.save();
					}
				});
			});
		});
	});
}

MemberSheet.prototype.getSynd = function() {
	return Syndicate.get(this.sid);
}

MemberSheet.prototype.save = function() {
	var sql, self = this;
	
	var values = {
		last_read: this.last_read
	};
	
	if (this.msid) {
		sql = 'UPDATE member_sheet SET ? WHERE msid='+this.msid;
	} else {
		sql = 'INSERT INTO member_sheet SET ?';
		util.extend(values, {
			sheet_id: this.sheet_id,
			sid: this.sid
		});
	}
	
	return chip.db.queryAsync(sql, values).then(function(result) {
		if (result[0].insertId) {
			self.msid = result[0].insertId;
			self.created = new Date();
		}
		
		return self;
	});
}
