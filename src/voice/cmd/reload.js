/*
  reload
  
  Reloads the engine data
*/

var GroupWriter = require('../group-writer');

exports.exp =  /^reload\s*$/i

exports.run = function(match, user, group) {
	var out = GroupWriter.create(group);
	var engine = group.getEngine();
		
	engine.loadAll().then(function() {
		out.print("Data reloaded");
	});
}
