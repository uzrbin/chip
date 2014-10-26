var jsdom = require("jsdom");
var util = require('./util');
var chip = require('../chip');
var Syndicate = require('../model/syndicate');
var deferred = require('deferred');
var utf8 = require('utf8');
var fs = require('fs');
var mysql = require('mysql');

var colOrder = {
	'name': 0,
	points: 1,
	rank: 2
}

var eid = 33;

function addRank(synd, rank, points) {
	
};

exports.doImport = function() {
	jsdom.env(
		"http://forums.gree.net/showthread.php?100104-Winners-Hillcrest-Massacre",
		[ "http://code.jquery.com/jquery.js" ],
		function (errors, window) {
			var $ = window.$, chain = deferred(0);
			
			var rows = $(".cms_table_grid_tr");
			rows = rows.slice(0,1500);
			rows.each(function() {
				var $row = $(this);
				var cells = $row.find('td');
				var nm = $(cells[colOrder['name']]).html();
				var points = parseInt($(cells[colOrder.points]).html());
				var rank = parseInt($(cells[colOrder.rank]).html());
				
				if (isNaN(points) || isNaN(rank)) {
					console.log("Invalid", $(cells[colOrder['name']]).html());
				} else {
					chain = chain.then(function() {
						return Syndicate.getByName(nm).then(function(synd) {
							if (synd) {
								return chip.db.queryAsync("INSERT INTO rank VALUES ('',"+synd.sid+","+eid+",null,null,"+
										points+","+rank+")");
							} else {
								nm = nm.replace(/&amp;/g, '&');
								return Syndicate.getByName(nm).then(function(synd) {
									if (synd) {
										return chip.db.queryAsync("INSERT INTO rank VALUES ('',"+synd.sid+","+eid+",null,null,"+
												points+","+rank+")");
									} else {
										return Syndicate.find(nm).then(function(synds) {
											if (synds) {
												var matches = 0, mtch;
												synds.forEach(function(synd) {
													if (nm.replace(/[^\u0000-\u007F]+/g, '') == synd.name.replace(/[^\u0000-\u007F]+/g, '')) {
														matches++;
														mtch = synd;
													}												
												});
												
												if (matches == 1) {
													return chip.db.queryAsync("INSERT INTO rank VALUES ('',"+mtch.sid+","+eid+",null,null,"+
															points+","+rank+")");
												} else if (matches == 0) {
													console.log("1Creating syndicate "+nm);
													
													return chip.db.queryAsync("INSERT INTO syndicate VALUES ('',"+mysql.escape(nm)+",'"+
															util.getSearch(nm)+"')").then(function(result) {
														chip.db.queryAsync("INSERT INTO rank VALUES ('',"+result[0].insertId+
																","+eid+",null,null,"+points+","+rank+")");
													});
												} else {
													console.log('OOPS MULTIPLE MATCHES FOR', nm, synds);
												}
											} else {
												console.log("2Creating syndicate "+nm);
												
												return chip.db.queryAsync("INSERT INTO syndicate VALUES ('','"+mysql.escape(nm)+"','"+
														util.getSearch(nm)+"')").then(function(result) {
													chip.db.queryAsync("INSERT INTO rank VALUES ('',"+result[0].insertId+
															","+eid+",null,null,"+points+","+rank+")");
												});
											}
										});
									}
								});
							}
						});
					});
				}
			});
			
			chain.then(function() {
				console.log("Import complete");
			});
		}
	);
}

exports.consolidateNames = function() {
	var sql = 'select * from syndicate where search in (select search from syndicate '+
			"group by search having count(sid) > 1) and search not in "+
			"('wolfgang','dilligaf','yolo','thegoodfellas') order by search, sid asc"
			
	chip.db.queryAsync(sql).then(function(result) {
		var original;
		result[0].forEach(function(row) {
			if (!original || row.search != original.search) {
				original = row;
				return;
			}
			
			//chip.db.queryAsync('UPDATE user SET sid='+original.sid+' WHERE sid='row.sid);
			chip.db.queryAsync('UPDATE rank SET sid='+original.sid+' WHERE sid='+row.sid);
			chip.db.queryAsync('DELETE FROM syndicate WHERE sid='+row.sid);
		});
	});
	
	sql = "select * from syndicate where search in (select concat(search,'a') from syndicate)";
	chip.db.queryAsync(sql).then(function(result) {
		result[0].forEach(function(row) {
			Syndicate.find(row.search.substring(0, row.search.length - 1)).then(function(synds) {
				if (synds && synds.length == 1) {	
					chip.db.queryAsync('UPDATE rank SET sid='+synds[0].sid+' WHERE sid='+row.sid);
					chip.db.queryAsync('DELETE FROM syndicate WHERE sid='+row.sid);
				}
			});
		});
	});
}

exports.loadMaster = function() {
	fs.readFile('/home/evan/work/chip/src/lib/synds.txt', 'utf8', function (err, data) {
		var syndNames = data.split('\n');
		syndNames.forEach(function(nm) {
			nm = nm.trim();
			if (nm.length) {
				Syndicate.find(nm).then(function(synds) {
					if (synds.length == 1) {
						var synd = synds[0];
						if (synd.name != nm)
							chip.db.queryAsync('UPDATE syndicate SET name=\''+nm+'\' WHERE sid='+synd.sid);
					} else {
						// synd not loaded
					}
				});
			}
		});
	});
}

exports.test = function() {
	fs.readFile('/home/evan/work/chip/src/lib/synds.txt', 'utf8', function (err, data) {
		var syndNames = data.split('\n');
		syndNames.forEach(function(nm) {
			var exp = /[^\u0000-\u007F]+/g
			var m = nm.match(exp);
			if (m)
				console.log(m, nm);
		});
	});
}

/*

wolfgang
dilligaf
yolo
thegoodfellas

*/
