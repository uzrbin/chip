var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');
var Event = require('./event');

exports.getByToken = function(token) {
	var sql = "SELECT * FROM account WHERE token='"+token+"'";

	return chip.db.queryAsync(sql).spread(function(result) {
		if (result.length == 1) {
			return new Account(result[0]);	
		} else {
			return null;
		}
	});
}

var Account = function(properties) {
	util.extend(this, properties);
}
