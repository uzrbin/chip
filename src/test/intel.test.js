var Sheet = require('../sheet-import'),
	mysql = require('mysql');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'evan',
	database : 'wbt'
});

Sheet.use(connection);

/*
// My test sheet
var sheet = Sheet.gdoc({
	auth: { email: 'uzrbin@gmail.com', password: 'sxw497794' },
	key: '0ApyEiOHzBteEdEJCTlloRTdfNkcwWkVjMGpNOFhMTnc',
	sheet: 'We Be Clubbin\' New',
	synd: 'synd',
	intel: 'player'
	
});
*/

/*
// Project phoenix sheet
var sheet = Sheet.gdoc({
	auth: { email: 'uzrbin@gmail.com', password: 'sxw497794' },
	key: '0AgHG5xXjt3k8dEpsRGJYeVg2X0FXUHJOOFdsNWJYRXc',
	sheet: 'Bay Harbour',
	synd: 'alphabeticalorderplease-a-z',
	intel: 'level-name-def'
});
*/

/*
// World Beaters sheet
var sheet = Sheet.gdoc({
	auth: { email: 'uzrbin@gmail.com', password: 'sxw497794' },
	key: '0AnVgNUkwYakUdC01QUxQdHUxcGVIODJ4YnVqY2RoLVE',
	sheet: 'Form Responses',
	synd: 'nameofscoutedsyndicate',
	intel: 'intelinformatname.leveldefence......'
});
*/

// Project phoenix sheet
var sheet = Sheet.gdoc({
	auth: { email: 'uzrbin@gmail.com', password: 'sxw497794' },
	key: '0AgHG5xXjt3k8dEpsRGJYeVg2X0FXUHJOOFdsNWJYRXc',
	sheet: 'Bay Harbor',
	synd: 'alphabeticalorderplease-a-z',
	intel: 'level-name-def'
});

sheet.importIntel();
