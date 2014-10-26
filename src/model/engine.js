var chip = require('../chip');
var Battle = require('./battle');
var Syndicate = require('./syndicate');
var Group = require('./group');
var User = require('./user');
var Player = require('./player');
var Sheet = require('./sheet');
var MemberSheet = require('./member-sheet');
var GroupWriter = require('../voice/group-writer');
var util = require('../lib/util');
var moment = require('moment');
var https = require('https');
var deferred = require('deferred');

require('array.prototype.find');

exports.get = function(eid) {
	var sql = "SELECT * FROM engine WHERE eid="+eid;

	return chip.db.queryAsync(sql).spread(function(result) {
		if (result.length == 1) {
			return new Engine(result[0]);	
		} else {
			return null;
		}
	});
}

exports.getAll = function() {
	return chip.db.queryAsync('SELECT * FROM engine').spread(function(result) {
		return result.map(function(e) { return new Engine(e); });
	});
}

exports.getBySynd = function(sid) {
	return chip.db.queryAsync('SELECT * FROM engine WHERE sid='+sid).spread(function(result) {
		if (result.length == 1) {
			return new Engine(result[0]);
		} else {
			return null;
		}
	});
}

exports.create = function(properties) {
	return new Engine(properties);
}

var Engine = function(properties) {
	util.extend(this, properties);
};

Engine.prototype.init = function() {
	var self = this;
	
	this.status = 'IDLE';
	this.recentMsgs = {};
	this.battle = null;
	this.prevMsg = null;
	
	return this.loadAll().then(function() {
		setInterval(function() { self.run() }, 5000);
	});
}

Engine.prototype.run = function() {
	var self = this;
	
//console.log('running', this);
	if (this.battle) {
		// Update roll call
		if (this.battle.rcConf) {
			/*
			var cfg = this.battle.rcConf;
			var req = https.get('https://api.groupme.com/v3/groups/'+cfg.groupId+'/messages/'+
					cfg.messageId+'?token='+cfg.userToken, function(res) {		
				var responseString = '';
				
				res.on('data', function(data) {
					responseString += data;
				});
		
				res.on('end', function() {
					if (responseString && responseString.length > 3) {
						var r = JSON.parse(responseString);
						
						if (r && r.response && r.response.message) {
							self.battle.attendance = r.response.message.favorited_by;
						} else {
							console.log('unknown response', responseString);
						}
					}
				});
			});
			*/
		}
		
		// Do this last as it could remove the battle object
//console.log(now, this.battle.getEnd(), now.valueOf(), this.battle.getEnd().valueOf());			
		if ((this.status == 'NEW' || this.status == 'ANNOUNCED') &&  moment(this.battle.start).isBefore()) {
			this.battle.status = 'ACTIVE';
			this.status = 'ACTIVE';
		} else if (this.status == 'NEW' && moment(this.battle.start).clone().subtract(5, 'minutes').isBefore()) {
			this.status = 'ANNOUNCED';
			this.output("Battle starts "+moment(this.battle.start).fromNow());
		} else if ((this.status == 'ACTIVE' || this.status == 'WARNED') && moment(this.battle.getEnd()).isBefore()) {
			this.status = 'NEW';
			this.battle.status = 'FINISHED';
			this.battle.save();
			
			var str = 'Battle ';
			if (this.battle.synd2)
				str += "against " + this.battle.synd2.name + " ";
			str += "has ended.";
			if (this.battle.synd2)
				str += '\nPlease let me know how we did using "result [our points]-[their points]"\n';
			this.output(str);
			
			this.prevBattle = this.battle;
			delete this.battle;
		} else if (this.status == 'ACTIVE' && moment(this.battle.getEnd()).subtract(5, 'minutes').isBefore()) {
			this.status = 'WARNED';
			this.output(this.formatStatus());
		}
	}
	
	if (!this.lastMemberImport || !this.lastMemberImport.isSame(moment(), 'hour')) {
		MemberSheet.getBySynd(this.synd).then(function(mss) {
			mss.forEach(function(ms) {
				ms.importMembers().then(function() {
					ms.last_read = new Date();
					ms.save();
					
					self.lastMemberImport = moment();
				});
			});
		});
	}
}

Engine.prototype.gotMessage = function(msg, user, fromGroup)  {
	if (user && user.pid) {
		this.recentMsgs[user.pid] = msg;
		console.log('['+this.sid+'|'+fromGroup.groupme_id+'|'+fromGroup.name+'] ('+user.pid+')'+msg.name+': '+msg.text);
		
		if (this.battle)
			this.battle.online[user.pid] = user;
	} else {
		console.log('why here?', user);
	}
	
	this.prevMsg = msg;
}

Engine.prototype.scheduleBattle = function(start) {
	this.status = 'NEW';
	var s = start || moment().add(20, 'minutes');
	
	this.battle = Battle.create({ start: s, sid1: this.synd.sid });
}

Engine.prototype.startBattle = function(synd2) {
	this.status = 'ACTIVE';
	
	if (!this.battle) {
		this.battle = Battle.create({ start: moment(), sid1: this.synd.sid, sid2: synd2.sid });
	} else {
		this.battle.start = moment();
		
		if (synd2) this.battle.setOpponent(synd2);
	}
	
	this.battle.status = 'ACTIVE';
}

Engine.prototype.syncBattle = function(end) {
	if (this.status != 'WARNED')
		this.status = 'ACTIVE';
		
	this.battle.status = 'ACTIVE';
	
	if (!this.battle)
		this.battle = Battle.create(moment(), this.syndicate);
		
	this.battle.setEnd(end);
}

Engine.prototype.setRollCall = function(config) {
	if (this.battle)
		this.battle.rcConf = config;
	else
		console.log('Cannot set roll call, no battle');
}

Engine.prototype.getAttendance = function() {
	if (this.battle && this.battle.attendance) {
		var members = [], unmatched = [], self = this;
	
		this.battle.attendance.forEach(function(groupme_id) {
			var user = self.getUser({ groupme_id : groupme_id });
			var players = self.getPlayers({ user: user });
			members = members.concat(players);
		});
	
		return members;
	} else {
		return null;
	}
}

Engine.prototype.debug = function(msg) {
	this.getGroups({ debug: true }).forEach(function(group) {
		var gw = GroupWriter.create(group);
		gw.print(msg);
	});
}

Engine.prototype.output = function(msg) {
	this.getGroups({ output: true }).forEach(function(group) {
		var gw = GroupWriter.create(group);
		gw.print(msg);
	});
}

Engine.prototype.loadSynd = function() {
	var self = this;
	
	return Syndicate.get(this.sid).then(function(synd) {
		self.synd = synd;
	});
}

Engine.prototype.loadGroups = function() {
	var self = this;
	
	return Group.getBySynd(this.sid).then(function(groups) {
		self.groups = groups;
		groups.forEach(function(g) { chip.addGroup(g); });
	});
}

Engine.prototype.loadUsers = function() {
	var self = this;
	
	return User.getBySyndId(this.sid).then(function(users) {
		return self.users = users;
	});
}

Engine.prototype.loadPlayers = function() {
	var self = this;
	
	return Player.getBySynd(this.synd).then(function(players) {
		return self.players = players;
	});
}

Engine.prototype.loadAll = function() {
	var self = this;
	
	return this.loadSynd().then(function() { 
		return deferred(self.loadGroups().promise, self.loadUsers().promise, self.loadPlayers().promise) 
	});
}

Engine.prototype.getPlayer = function(options) {
	if (options.uid)
		return this.players.find(function(p) { return p.uid == options.uid });
}

Engine.prototype.getPlayers = function(options) {
	if (options) {
		if (options.user)
			return this.players.filter(function(elem) { return elem.pid == options.user.pid;  });
		else if (options.name) {
			return this.players.filter(function(elem) { return elem.name == options.name;  });
		} else if (options.search) {
			return this.players.filter(function(elem) { 
				return util.getSearch(elem.name) == util.getSearch(options.search); 
			});
		}
	} else {
		return this.players;
	}
}

Engine.prototype.getUser = function(options) {
	if (options.player)
		return this.users.find(function(elem) { return elem.pid == options.player.pid });
	else if (options.groupme_id)
		return this.users.find(function(elem) { return elem.groupme_id == options.groupme_id;  });
}

Engine.prototype.getUsers = function(options) {
	if (options.search) {
		return this.users.filter(function(elem) { 
			return util.getSearch(elem.name) == util.getSearch(options.search) 
		});
	} else if (options.name) {
		return this.users.filter(function(elem) { return elem.name == options.name;  });
	}
}

Engine.prototype.getGroup = function(options) {
	if (options.code)
		return this.groups.find(function(elem) { return elem.code == options.code;  });
	else if (options.gid)
		return this.groups.find(function(elem) { return elem.gid == options.gid;  });
}

Engine.prototype.getGroups = function(options) {
	if (options.output)
		return this.groups.filter(function(g) { return g.output == 1; });
	else if (options.debug)
		return this.groups.filter(function(g) { return g.debug == 1; });
	return this.groups;
}

Engine.prototype.formatStatus = function() {
	var str;
	
	if (this.status == 'IDLE') {
		str = 'No active battles';
	} else if (this.status == 'NEW' || this.status == 'ANNOUNCED') {
		str = 'Battle scheduled for '+this.battle.start.fromNow(true);
	} else if (this.status == 'ACTIVE' || this.status == 'WARNED') {
		str = "Battle ";
		if (this.battle.opponent)
			str += "against " + this.battle.opponent.name + " ";
		str += 'will end in '+util.formatTimeTo(this.battle.getEnd());
//console.log(this);		
		if (this.battle.points1 && this.battle.points2)
			str += '\nScore is '+util.formatStat(this.battle.points1)+' to '+util.formatStat(this.battle.points2)+
				' ('+moment(this.battle.updated).fromNow()+')';
	} else {
		str = 'Chip is confused';
	}
	
	return str;
}

Engine.prototype.save = function() {
	var sql, self = this;
	
	var values = {
		sid: this.sid
	};
	
	if (this.show_links) values.show_links = this.show_links;
	
	if (this.eid) {
		sql = 'UPDATE engine SET ? WHERE eid='+this.eid;
	} else {
		sql = 'INSERT INTO engine SET ?';
	}
	
	return chip.db.queryAsync(sql, values).then(function(result) {
		if (result[0].insertId) {
			self.eid = result[0].insertId;
			self.created = new Date();
		}
		
		return self;
	});
}

