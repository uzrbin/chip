var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');

exports.getBySynd = function(synd) {
	var sql = "SELECT * FROM player p WHERE p.sid="+synd.sid;
	
	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(u) { return new User(u); });
	});
}

exports.getBySyndId = function(syndId) {
	var sql = "SELECT * FROM player p WHERE p.sid="+syndId;
	
	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(u) { return new User(u); });
	});
}

exports.create = function() {
	return new User();
}

var User = function(properties) {
	util.extend(this, properties);
}

User.prototype.formatInfo = function() {
	return this.name;
}

User.prototype.save = function() {
	var sql, self = this;
	
	var values = {
		name: this.name,
		location: this.location,
		avatar_url: this.avatar_url
	};
	
	if (this.pid) {
		sql = 'UPDATE player SET ? WHERE pid='+this.pid;
	} else {
		sql = 'INSERT INTO player SET ?';
		util.extend(values, {
			sid: this.sid,
			groupme_id: this.groupme_id
		});
	}
	
	return chip.db.queryAsync(sql, values).then(function(result) {
		if (result[0].insertId) {
			self.pid = result[0].insertId;
			self.created = new Date();
		}
		
		return self;
	});
}
