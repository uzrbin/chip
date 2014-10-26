var Promise = require('bluebird');
var GoogleSpreadsheet = Promise.promisifyAll(require("google-spreadsheet"));
var User = require('./user');
var Syndicate = require('./syndicate');
var UserParser = require('../lib/user-parser');
var chip = require('../chip');
var util = require('../lib/util');

require('array.prototype.find');

exports.get = function(sheet_id) {
	return chip.db.queryAsync("SELECT * FROM sheet WHERE sheet_id="+sheet_id).spread(function(result) {
		if (result.length == 1)
			return new Sheet(result[0]);
		
		return null;
	});
}

var Sheet = function(config) {
	util.extend(this, config);
	
	this.book = new GSheet({
		key: this.token,
		auth: { 
			email: this.username,
			password: this.password
		}
	});
}

Sheet.prototype.getSheet = function() {
	return this.book.getSheet(this.title);
}

Sheet.prototype.getRows = function() {
	var self = this;
	return this.book.getSheet(this.title).then(function(sheet) {
		return self.book.getRows(sheet);
	});
}

var GSheet = function(config) {
	util.extend(this, config);
	this.authorized = false;
	this.sheet = new GoogleSpreadsheet(this.key);	
	Promise.promisifyAll(this.sheet)
}

GSheet.prototype.authorize = function() {
	return this.sheet.setAuthAsync(this.auth.email, this.auth.password).then(function() {
		this.authorized = true;
	});
}

GSheet.prototype.getSheets = function() {
	return this.sheet.getInfoAsync();
}

GSheet.prototype.getSheet = function(title) {
	return this.getSheets().then(function(sheets) {
		return sheets.worksheets.find(function(sheet) { return sheet.title = title });
	});
}

GSheet.prototype.getRows = function() {
	return this.getSheet().then(function(sheet) {
		Promise.promisifyAll(sheet);
		return sheet.getRowsAsync();
	});
}

GSheet.prototype.getRows = function(sheet) {
	console.log(sheet);
	Promise.promisifyAll(sheet);
	return sheet.getRowsAsync();
}

GSheet.prototype.findRow = function(title, value) {
	var found = false;
	
	return this.getRows().then(function(rows) {
		rows.forEach(function(row) {
			if (row[title] == value)
				return row;
		});
	});
}
