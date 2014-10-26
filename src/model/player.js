var chip = require('../chip');
var util = require('../lib/util');
var Stats = require('./stats');
var deferred = require('deferred');

exports.get = function(id) {
	var def = deferred();
	var sql = "SELECT * FROM user WHERE uid=" + id;
	
	chip.conn.query(sql, function(err, result) {
		if (err) throw err;
		
		if (result.length == 1) {
			def.resolve(new Player(result[0]));
		} else {
			def.reject("No user with id " + id);
		}
	});
	
	return def.promise;
}

exports.getBySynd = function(synd) {
	return chip.db.queryAsync("SELECT * FROM user WHERE sid="+synd.sid).spread(function(result) {
		return result.map(function(p) { 
			var player = new Player(p);  
			return player; 
		});
	});
}

exports.findBySyndIdPlayer = function(sid, player) {
	return chip.db.queryAsync("SELECT * FROM user WHERE sid="+sid+" AND search like '%"+
			util.getSearch(player.name)+"%' ORDER BY created DESC").spread(function(result) {
				if (result.length >= 1) {
					return new Player(result[0]);
				} else {
					return null;
				}
			});
}

exports.unsetUser = function(user) {
	return chip.db.queryAsync("UPDATE user SET pid=NULL WHERE pid="+user.pid);
}

exports.create = function(properties) {
	return new Player(properties);
}

exports.sortIntel = function(a, b) {
	if (a.stats.dl && b.stats.dl) return 0;
	if (a.stats.dl) return -1;
	if (b.stats.dl) return 1;
	
	if (a.stats.level == b.stats.level)
		return b.stats.defense - a.stats.defense;
	
	return b.stats.level - a.stats.level;
}

exports.sortMembers = function(a, b) {
	if (!a.stats && !b.stats) return 0;
	if (a.stats && !b.stats) return -1;
	if (!a.stats && b.stats) return 1;
	
	if (a.stats.level == b.stats.level)
		return b.stats.attack - a.stats.attack;
	
	return b.stats.level - a.stats.level;
}

var Player = function(properties) {
	util.extend(this, properties);
}

Player.prototype.formatInfo = function() {
	return this.name;
}

Player.prototype.getStats = function(priv) {
	var self = this;
	
	if (!this.stats) return this.getAllStats(priv).then(function (allStats) {
		return self.stats;
	});
	
	return deferred(this.stats);
}

Player.prototype.getAllStats = function(priv) {
	var self = this;
	
	return Stats.getByPlayer(this, priv).then(function(allStats) {
		if (allStats.length)
			self.stats = allStats[0];
		
		return allStats;
	});
}

Player.prototype.save = function() {
	var sql, self = this;
	
	var values = {
		pid: this.pid,
		mafia_id: this.mafia_id
	};
	
	if (this.uid) {
		sql = 'UPDATE user SET ? WHERE uid='+this.uid;
	} else {
		sql = 'INSERT INTO user SET ?';
		util.extend(values, {
			sid: this.sid,
			name: this.name,
			search: util.getSearch(this.name),
			groupme_id: this.groupme_id
		});
	}
	
	return chip.db.queryAsync(sql, values).then(function(result) {
		if (result[0].insertId) {
			self.uid = result[0].insertId;
			self.created = new Date();
		}
		
		return self;
	});
}

/*

GSheet.prototype.updateMember = function (user) {
	var now = new Date();
console.log(user);
	this.getRow('membername', user.name, function(row) {
		row.level = user.level;
		row.attack = user.attack;
		row.defense = user.defense;
		row.mafia = user.mafia;
		row.save();
		
		if (now.getDate() == user.updated.getDate()) {
			User.updateOrCreate(1, user);
		} else {
			conn.query('INSERT INTO user_stats SET ?',
				{	uid: user.id, level: user.level, mafia: user.mafia, 
					attack: user.attack, defense: user.defense
				}, function(err, result) {
					if (err) throw err;
				}
			);
		}
	});
}

*/

/*
exports.findByCond = function(cond) {
	var self = this, def = deferred();
	
	var sql = "SELECT * FROM user WHERE " + cond;
	
	dbConn.query(sql, function(err, result) {
		if (err) throw err;
		
		result.forEach(function(row) {
			var user = new Player(row);
			sql = 'SELECT * FROM user_stats us WHERE uid='+row.uid+' ORDER BY created DESC';
			
			dbConn.query(sql, function(err, result) {
				if (err) throw err;
				
				for (var i = 0; i < result.length; i++) {
					var stats = result[i];
					statIds.push(stats.sid);
					
					if (i == 0) {
						user.level = stats.level;
						user.defense = stats.defense;
						user.attack = stats.attack;
						user.mafia = stats.mafia;
						user.updated = stats.created;
					}
				}
			});
		});
	});
	
	return def.promise;
}

exports.updateOrCreate = function(syndId, u, callback) {	
	var sql = "SELECT *, name AS handle FROM user WHERE sid=" + syndId;
	if (u.uid)
		sql += ' AND uid=' + u.uid;
	else
	 	sql += ' AND search =\'' + util.getSearch(u.name) + "'"
	sql += " ORDER BY created DESC"; 
	
	dbConn.query(sql, function(err, result) {
		if (err) throw err;

		if (result.length == 0) {
			// New user
			if (result.length != 1) {
				u.sid = syndId;
				u.save(callback);
			} 
		} else {
			var user = new Player(result[0]);
			
			sql = "SELECT * FROM user_stats us WHERE uid=" + user.uid + " AND created=" +
				"(SELECT MAX(created) FROM user_stats us2 WHERE us2.uid=us.uid GROUP BY uid)";
			
			dbConn.query(sql, function(err, result) {
				if (err) throw err;
				
				if (result.length == 1) {
					var stats = result[0];
// console.log(stats, u)
					if (stats.defense > u.defense) {
						user.level = stats.level;
						user.defense = stats.defense;
						user.updated = stats.created;
						
						if (callback)
							callback(user);
					} else {
						user.level = u.level;
						user.defense = u.defense;
						
						if (u.attack)
							user.attack = u.attack;
						if (u.mafia)
							user.mafia = u.mafia;
						
						// Update if the record is less than 3 days old			
						if ((new Date() - stats.created) > 1000*60*60*24*3) {
							user.save(callback);
						} else {
							user.updated = new Date();
							
							var updates = {
								level: user.level,
								defense: user.defense,
								created: user.updated
							}
						
							if (u.attack)
								updates.attack = u.attack;
							if (u.mafia)
								updates.mafia = u.mafia;
						
	//console.log('updating', updates, u);				
							dbConn.query('UPDATE user_stats SET ? WHERE sid=' + stats.sid, updates)
							
							if (callback)
								callback(user);
						}
					}
				} else {
					console.log("Number of stat readings for user id " + user.uid + " is " + result.length);
					if (callback)
						callback();
				}
			});
		}
	});
}
// Calling this will *always* create a row in stats
Player.prototype.save = function(callback) {
	var that = this;
	console.log(this);
	if (this.uid) {
		dbConn.query("INSERT INTO user_stats SET ?", {
			uid: that.uid,
			level: that.level,
			defense: that.defense
			//mafia: this.mafia
		}, function(err, result) {
			if (err) throw err;
			
			that.stat_id = result.insertId;		
			if (callback)	
				callback(that);
		})
	} else {	
		dbConn.query("INSERT INTO user SET ?", { 
			name: this.name,
			search: util.getSearch(this.name),
			sid: that.sid
		}, function(err, result) {
			if (err) throw err;
			that.uid = result.insertId;
			that.id = result.insertId;
			
			dbConn.query("INSERT INTO user_stats SET ?", {
				uid: that.id,
				level: that.level,
				defense: that.defense
				//mafia: this.mafia
			}, function(err, result) {
				if (err) throw err;
				
				that.stat_id = result.insertId;
				if (callback)			
					callback(that);
			});
		});
	}
}

Player.prototype.formatStats = function() {
	var str = '',
		both = this.attack && this.defense;
	
	if (this.level)
		str += this.level + " ";
	str += this.name;
	if (this.mafia_id)
		str += " ["+this.mafia_id+"]";		
	if (this.attack)
		str += " " + util.formatStat(this.attack);
	if (both)
		str += "/";
	else if (!this.attack)
		str += " ";
	if (this.defense)
		str += util.formatStat(this.defense);
		
	if (this.mafia)
		str += ", Mafia: "+this.mafia;
	
	if (this.level && both)
		str += " - RSI: " + Math.round((this.attack +  this.defense) / (this.level * 1000));
	
	
	if (this.updated) {
		var now = new Date(), age = Math.round((now.valueOf() - this.updated.valueOf()) / (1000*60*60*24));
		
		if (age > 3)
			str += " (" + age + " days ago)";
	}
	
	return str;
}

Player.prototype.formatInfo = function() {
	var str = '',
		both = this.attack && this.defense;
	
	str += this.name;
	if (this.mafia_id)
		str += " ["+this.mafia_id+"]";
	if (this.level)
		str += " L" + this.level;
	str += ", Stats: "	
	if (this.attack)
		str += util.formatStat(this.attack);
	if (both)
		str += "/";
	str += util.formatStat(this.defense);
		
	if (this.mafia)
		str += ", Mafia: "+this.mafia;
	
	if (this.level && both)
		str += ", RSI: " + Math.round((this.attack +  this.defense) / (this.level * 1000));
	
	
	var updated = moment(this.updated);
	if (updated.add(3, 'days').isBefore())
		str += ' ('+updated.fromNow()+')';
	
	return str;
}
*/