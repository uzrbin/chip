/*
	help
	
	Prints the help url
*/

var GroupWriter = require('../group-writer');

exports.exp = /^help\s*$/i

exports.run = function(match, user, group) {
	var out = GroupWriter.create(group);
	out.print('http://chip.uzrbin.com');
}
