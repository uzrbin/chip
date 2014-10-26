/*
	start ([minutes])
	
	Starts a battle in the specified number of minutes, or a default if none is specified
*/

var GroupWriter = require('../group-writer');
var moment = require('moment');

exports.exp = /^start(?:\s+([0-9]+))??(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var start;
	
	if (match[1])
		start = moment().add(parseInt(match[1]), 'minutes');
	
	group.getEngine().scheduleBattle(start);
	gw.print(group.getEngine().formatStatus());
}