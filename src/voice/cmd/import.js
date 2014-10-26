/*
	import123
	
	Imports the intel spreadsheet
*/

var IntelImport = require('../../lib/intel-import');
var GroupWriter = require('../group-writer');

exports.exp = /^import123$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	IntelImport.run();
}
