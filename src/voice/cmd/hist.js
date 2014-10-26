/*
  hist [syndicate]
  
  Prints the recent rankings of the specified syndicate
*/

var GroupWriter = require('../group-writer');
var Syndicate = require('../../model/syndicate');
var chip = require('../../chip');
var util = require('../../lib/util');

exports.exp = /^hist(?:\s+(.+?))\s*$/i

exports.run = function(match, user, group) {
	var gw = GroupWriter.create(group);
			
	Syndicate.find(match[1]).then(function(synds) {
		if (synds.length > 0) {
			
			synds.forEach(function(synd) {
				gw.write("History for: " + synd.name);		
				var sql = "SELECT * FROM rank JOIN event USING (eid) WHERE sid=" + synd.sid + " ORDER BY end desc LIMIT 6";
				chip.db.query(sql, function(err, hist) {
					if (err) throw err;
					
					hist.forEach(function(r) {
						gw.write(r.name + " -  Rank: " + r.rank + ", Points: " +  util.formatStat(r.points));
					});
					
					gw.end(function() {
						//if (engine.showLinks)
						//	gw.print("http://chip.uzrbin.com/intel/synd/" + synd.sid);
					});
				});
			});
		} else {
			gw.print('Syndicate "'+match[1]+'" not found');
		}
	});
}
