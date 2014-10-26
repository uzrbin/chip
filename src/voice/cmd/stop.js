/*
	stop
	
	Ends any current battles
*/

var GroupWriter = require('../group-writer');

exports.exp = /^stop\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	engine.status = 'IDLE';
	delete engine.battle;
	
	gw.print('Battle has been stopped');
}
