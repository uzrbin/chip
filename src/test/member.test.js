var Sheet = require('../sheet-import'),
	mysql = require('mysql');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'pi',
	database : 'wbt'
});

Sheet.use(connection);

var sheet = Sheet.gdoc({
	auth: { email: 'uzrbin@gmail.com', password: 'sxw497794' },
	key: '0AmiEwfBNTtBndDY2MUlJZWRXV0pjSTFJZjR1a0tWN0E',
	sheet: 'MEMBER STATS'
});

sheet.importMembers();
