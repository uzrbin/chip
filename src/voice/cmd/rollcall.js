/*
	rollcall
	
	Flags the current post as a roll call post.  It will try to be monitored for "likes"
		users who have "liked" the post will be counted as present.  
		Requires a groupme user_token for the group with the rollcall post
*/

var GroupWriter = require('../group-writer');
var chip = require('../../chip');

exports.exp = /^.*rol(?:l|e)\s*call.*$/i

exports.run = function(match, user, group, raw) {
	var engine = group.getEngine();
	var out = GroupWriter.create(group);
	var fromGroup = chip.getGroup(raw.group_id);
	
	if (group.scout && group.user_token) {
		if (!engine.battle)
			engine.scheduleBattle();
			
		engine.setRollCall({
			groupId: fromGroup.groupme_id,
			messageId: raw.id,
			userToken: fromGroup.user_token
		});
		
		engine.debug("Roll Call Initiated");
	} else {
		console.log('Roll call not enabled for group '+fromGroup.groupme_id);
	}
}
