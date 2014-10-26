/*
  end ([minutes(:[seconds])])
  
  Specifies the time until
*/

var GroupWriter = require('../group-writer');
var moment = require('moment');

exports.exp =  /^end\s+([0-9]{1,3}):?([0-9]{1,2})?(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
		
	if (engine.battle) {
		var end = moment().add(parseInt(match[1]), 'minutes');
		if (match[2])
			end.add(parseInt(match[2]), 'seconds');
			
		engine.syncBattle(end);
		gw.print(engine.formatStatus());
	} else {
		gw.print('No active battles');
	}
}
