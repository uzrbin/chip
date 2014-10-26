/*
	[us]-[them]
	
	Updates the record of the battles score.  Prints a time difference and countdown.
*/

var GroupWriter = require('../group-writer');
var moment = require('moment');
var util = require('../../lib/util');

exports.exp = /^([0-9,k]+)\s*[-/]\s*([0-9k,]+)(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	if (engine.battle && engine.battle.status == 'ACTIVE') {
		var points1 = match[1],
			points2 = match[2];
			
		if (isNaN(points1)) {
			points1 = parseInt(points1.replace(/,/g, ''));
		} if (isNaN(points2)) {
			points2 = parseInt(points2.replace(/,/g, ''));
		}
		
		if (points1 < 1000) points1 = points1*1000;
		if (points2 < 1000) points2 = points2*1000;
		
		if (!isNaN(points1) && !isNaN(points2)) {
			engine.battle.points1 = points1;
			engine.battle.points2 = points2;
			engine.battle.updated = moment().toDate();
			engine.battle.save();
			
			var winning = parseInt(engine.battle.points1) > parseInt(engine.battle.points2),
				diff = Math.abs(engine.battle.points1 - engine.battle.points2);
			
			gw.print((winning?'Ahead ':'Behind ')+util.formatStat(diff)+' with '+util.formatTimeTo(engine.battle.getEnd())+' remaining');
		} else {
			engine.debug('Could not update score ' + match[0]);
		}
	}
}
