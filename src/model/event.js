var util = require('../lib/util');
var chip = require('../chip');
var deferred = require('deferred');

exports.get = function(id) {
	var sql = "SELECT * FROM event WHERE eid="+id;

	return chip.db.queryAsync(sql).spread(function(result) {
		if (result.length == 1) {
			return new Event(result[0]);
		} else {
			throw new Error("Invalid event id"+id);
		}
	});
}

var Event = function(properties) {
	util.extend(this, properties);
}
