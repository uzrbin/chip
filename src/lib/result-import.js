var mysql = require('mysql'),
	fs = require('fs'),
	Syndicate = require('../model/syndicate'),
	util = require('./util');

var dbConn = mysql.createConnection({
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
});

var warId = 27;
	
fs.readFile('result.txt', 'utf8', function (err,data) {
	if (err) {
		return console.log(err);
	}
//	console.log(data);
	var ex, regex = /^(.*?)\s+([0-9,]+)\s+([0-9]+)\s*$/mg;
	while ((ex = regex.exec(data)) !== null) {
		var nm1 = ex[1], pts1 = ex[2].replace(/,/g, ''), rnk1 = ex[3];		
		
		(function(nm, rank, points) {
			dbConn.query("SELECT * FROM syndicate WHERE ?", { name: nm }, function(err, result) {
				if (err) throw err;
				
				if (result.length == 1) {
					var synd = result[0];
					dbConn.query("INSERT INTO rank SET ?", { sid: synd.sid, eid: warId, points: points, rank: rank });
				} else if (result.length > 1) {
					console.log("Found two syndicates with name "+nm);
				} else {
					dbConn.query("INSERT INTO syndicate SET ?", { name: nm, search: util.getSearch(nm) }, function(err, result) {	
						if (err) throw err;					
						dbConn.query("INSERT INTO rank SET ?", { sid: result.insertId, eid: warId, points: points, rank: rank });
					});
				}
			});
		})(nm1, rnk1, pts1);
// console.log("#" + ex[3] + " " + ex[1] + " - " + ex[2]);
	}

	console.log("War imported");
});
