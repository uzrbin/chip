var https = require('https');
var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');

exports.get = function(gid) {	
	var sql = "SELECT * from grp WHERE gid="+gid;
	return chip.db.queryAsync(sql).spread(function(result) {
		if (result.length == 1) {
			return new Group(result[0]);
		} else {
			return null;
		}
	});
}

exports.getByGroupmeId = function(groupme_id) {
	var sql = "SELECT * from grp WHERE groupme_id="+groupme_id;
	return chip.db.queryAsync(sql).spread(function(result) {
		if (result.length == 1) {
			return new Group(result[0]);
		} else {
			return null;
		}
	});
}

exports.getBySynd = function(sid) {	
	var sql = "SELECT * from grp WHERE sid="+sid;
	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(g) { return new Group(g); });
	});
}

exports.create = function(properties) {
	return new Group(properties);
}

var Group = function(properties) {
	util.extend(this, properties);
}

Group.prototype.getEngine = function() {
	return chip.getEngine(this.sid);
}

Group.prototype.post = function(text, writer) {
	var def = deferred();
	
	var msg = {
		"text": text,
		"bot_id": this.bot_key
	};
	
	var msgStr = JSON.stringify(msg);
//console.log('posting', msgStr);
	var headers = {
		'Content-Type': 'application/json; charset=utf-8'
	};

	var options = {
		host: 'api.groupme.com',
		port: 443,
		path: '/v3/bots/post',
		method: 'POST',
		headers: headers
	};
//console.log(options, msgStr);
	var self = this;
	var req = https.request(options, function(res) {
		res.setEncoding('utf-8');

		var responseString = '';
		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			def.resolve();
		
			if (responseString && responseString.length > 3)
				console.log('post response:', responseString);
		});
		
		res.on('error', function(e) {
			console.log('posting error:', e, e.stack);
		});
	});

	req.on('error', function(e) {
		console.log('post error:', e, e.stack);
	});

	req.write(msgStr);
	req.end();
	
	return def.promise;
}

Group.prototype.save = function() {
	var sql, self = this;
	
	var values = {
		groupme_id: this.groupme_id,
		bot_key: this.bot_key,
		output: this.output,
		scout: this.scout,
		debug: this.debug
	};
	
	if (this.name) values.name = this.name;
	if (this.bot_id !== undefined) values.bot_id = this.bot_id;
	if (this.user_token) values.user_token = this.user_token;
	
	if (this.gid) {
		sql = 'UPDATE grp SET ? WHERE gid='+this.gid;
	} else {
		sql = 'INSERT INTO grp SET ?';
		values = util.extend(values, {
			sid: this.sid
		});
	}
	
	return chip.db.queryAsync(sql, values).then(function(result) {
		if (result[0].insertId) {
			self.gid = result[0].insertId;
		}
		
		return self;
	});
}
