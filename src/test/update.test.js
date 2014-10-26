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
	key: '0ApijE9IASRQ7dGtsY01aQlR6QUpIMDA1VEpnZnVTdnc',
	sheet: 'Members'
});

sheet.updateRow({
	filterTitle: 'name',
	filterValue: 'Hexagon',
	updateTitle: 'timezone',
	updateValue: 'Frogs'
});
