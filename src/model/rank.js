var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');
var Event = require('./event');

exports.getBySynd = function(synd) {
	var sql = "SELECT * FROM rank WHERE sid="+synd.sid;

	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(r) { return new Rank(r); });
	});
}

var Rank = function(properties) {
	util.extend(this, properties);
}

Rank.prototype.getEvent = function() {
	return Event.get(this.eid);
}
