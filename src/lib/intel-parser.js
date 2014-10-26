 importIntel: function(docKey, username, password, warId) {
 console.log(docKey, username, password, warId);
		var GoogleSpreadsheet = require("google-spreadsheet");
		var intelBook = new GoogleSpreadsheet(docKey);
		
		intelBook.setAuth(username, password, function(err) {
		intelBook.getInfo(function(err, info) {
//console.log('bookey', err, info);
			var bookFmt, sheetFmt;
			
			info.worksheets.forEach(function (sheet) {
console.log('sheit', sheet);				
				var title = sheet['title'];
				
				util.searchSynd(title, function(synd) {
					if (synd) {
console.log('sheet title is a syndicate.  not implemented.');					
					} else {
						if (warId) {
							if (title == "Nightlife Knockout") {
							//if (title == "Form Responses") {								
console.log('importing sheet');
								sheet.getRows(function(err, rows) {
//console.log('rows rez', err, rows.length);									
//console.log('rows result ', err, rows);	
									var i = 0;
									rows.forEach(function(row) {
//console.log(row);				
										//var syndName = row.nameofscoutedsyndicate, pStr = row.detailsinformatnameleveldefence;
										var syndName = row.syndicate, pStr = row['level-name-def'];
										if (pStr.length > 0) {
											var up = new UserParser(pStr);
											var strUser;
//console.log(up, syndName)											
											while ((strUser = up.exec()) != null) {
//console.log('i gto a damn matsche', strUser, syndName);											
												//var sUser = strUser;
												(function(sUser) {
													util.searchSynd(syndName, function(synd) {
//console.log('synd', synd, sUser)										
														if (synd) {			
															sUser.sid = synd.sid		
															// We parsed the intel and found the synd check our db for the user
															util.searchUser(sUser, function(dbUser) {
																if (dbUser) {
																	// Update the statas
																	dbUser.level = sUser.level
																	dbUser.mafia = sUser.mafia
																	dbUser.attack = sUser.attack
																	dbUser.defense = sUser.defense
																} else {
																	// Create new user
																	dbUser = sUser;
																}
//console.log('saving', dbUser)		
																dbUser.save();
															});
														}
													});
												})(strUser);
											}
										}
									});
								});
							}
						} else {
console.log('may be war.  detecting.');
							dbConn.query("SELECT eid FROM event WHERE ?", { name: title }, function(err, result) {
console.log('result', err, result);
								if (result.size <= 0) console.log('nothing found for ' + title);
								else {
									warId = result[0].eid;
console.log('found', warId);
									console.log(warId);
								}
							});
						}  
					}
				});
			});
		});
		});
	}, 