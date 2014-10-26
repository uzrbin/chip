var chip = require('../chip');
var mysql = require('mysql');
var util = require('../lib/util');
var Rank = require('./rank');
var deferred = require('deferred');

exports.get = function(id) {
	return chip.db.queryAsync("SELECT * FROM syndicate WHERE sid="+id).spread(function(result) {
		if (result.length == 1) {
			return new Syndicate(result[0]);
		} else {
			throw new Error('No such syndicate');
		}
	});
};

exports.getByName = function(nm) {
	var sql = "SELECT * FROM syndicate WHERE name="+mysql.escape(nm);
	
	return chip.db.queryAsync(sql).spread(function(result) {
		if (result.length == 1) {
			return new Syndicate(result[0]);
		} else if(result.length > 1) {
			console.log("Duplicate syndicate found "+nm);
		} else {
			return null;
		}
	});
};

exports.find = function(nm) {
	var sql = "SELECT * FROM syndicate WHERE name="+mysql.escape(nm)+" OR "+
			" search="+mysql.escape(util.getSearch(nm))+" LIMIT 5";
	
	return chip.db.queryAsync(sql).spread(function(result) {
		return result.map(function(s) { return new Syndicate(s); });
	});
};

var Syndicate = function(properties) {
	util.extend(this, properties);
}

Syndicate.prototype.writeRanks = function(out) {
	return Rank.getBySynd(this).then(function(ranks) {
		if (ranks.length) {
			ranks.sort(function(r1, r2) { return r2.eid - r1.eid });
			ranks = ranks.slice(0, Math.min(ranks.length, 6));
			
			var promises = [], eventRanks = [];
			
			ranks.forEach(function(r) {
				promises.push(r.getEvent().then(function(e) {
					eventRanks.push({ evnt: e, rank: r });
				}));
			});
			
			return deferred.apply(this, promises).then(function() {
				var str = "";
				
				eventRanks.sort(function(a, b) {
					b.evnt.start - a.evnt.start;
				});
				
				out.write("Recent War History:\n");
				eventRanks.forEach(function(er) {
					out.write(er.evnt.name + " -  Rank: " + er.rank.rank + ", Points: " +  
							util.formatStat(er.rank.points));
				});
			})
		} else {
			return "No history available";
		}
	})
}
