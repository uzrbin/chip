var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');

exports.getByPlayer = function(player, priv) {
	var sql = "SELECT * FROM user_stats WHERE uid="+player.uid;
	sql += " AND private="+(priv?"true":"false");
	sql += " ORDER BY created DESC;";

	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(s) { return new Stats(s); });
	});
}

exports.create = function(properties) {
	return new Stats(properties);
}

var Stats = function(properties) {
	util.extend(this, properties);
}

Stats.prototype.save = function() {
	var sql, self = this;
	
	var values = {
		level: this.level,
		defense: this.defense,
		dl: this.dl || false
	};
	
	if (this.mafia) values.mafia = this.mafia;
	if (this.attack) values.attack = this.attack;
	
	if (this.stats_id) {
		sql = 'UPDATE user_stats SET ? WHERE stats_id='+this.stats_id;
	} else {
		sql = 'INSERT INTO user_stats SET ?';
		values = util.extend(values, {
			uid: this.uid,
			private: this.private
		});
	}
	
	return chip.db.queryAsync(sql, values).then(function(result) {
		if (result[0].insertId) {
			self.stats_id = result[0].insertId;
			self.created = new Date();
		}
		
		return self;
	});
}
