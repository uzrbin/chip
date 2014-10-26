/*
  load321
  
  Runs the selected rank import script
*/

var GroupWriter = require('../group-writer');
var RankParser = require('../../lib/result-parser.js');

exports.exp =  /^load321$/i

exports.run = function(match, user, group) {
	var out = GroupWriter.create(group);
	var engine = group.getEngine();
	
	RankParser.doImport();
}
