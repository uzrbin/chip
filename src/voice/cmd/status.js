/*
	status
	
	Prints a summary of the current battle state
*/

var GroupWriter = require('../group-writer');

exports.exp = /^status(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	gw.print(engine.formatStatus());
}
