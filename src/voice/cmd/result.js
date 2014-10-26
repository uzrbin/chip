/*
	result [us]-[them]
	
	Records the final score of the past battle
*/

var GroupWriter = require('../group-writer');
var util = require('../../lib/util');
var moment = require('moment');

exports.exp = /^result\s*([0-9,k]+)\s*[-/]\s*([0-9k,]+)(?:\s+([a-z]{2}))?\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
	var engine = group.getEngine();
	
	if (engine.prevBattle && engine.prevBattle.status == 'FINISHED') {
		var points1 = match[1],
			points2 = match[2];

		if (points1 < 1000) points1 = points1*1000;
		if (points2 < 1000) points2 = points2*1000;
		
		engine.prevBattle.points1 = points1;
		engine.prevBattle.points2 = points2;
		engine.prevBattle.updated = moment().toDate();
		engine.prevBattle.confirmed = true;
		engine.prevBattle.save();
		
		var win = parseInt(engine.battle.points1) > parseInt(engine.battle.points2)
		gw.print('Result for battle against '+engine.prevBattle.opponent.name+': '+(win?'WON ':'LOSS ')+
				util.formatStat(points1)+'-'+util.formatStat(points2));
	}
}
