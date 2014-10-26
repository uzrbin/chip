var User = require('../model/user');
var util = require('./util');

exports.create = function(config) {
	return new Parser(config);
}

var fragments = {
	levelSpecific: '[lev]+(?:[\\s\\.]*)([12]?\\d{1,2})',
	levelCommon: '([12]?\\d{1,2})',
	statUnits: '([0-9,\.]+)\\s*([kmb])[ilon]*',
	statCommon: '([0-9]{1,3}\\.[0-9]{1,3})',
	statFull: '([0-9]{7,12})',
	dl: '[\\(\\*]?dl[\\)\\*]?',
	def: '(?:d|def|defense)',
	att: '(?:a|att|attack)',
	startDelim: '(?:^|\\s+)',
	endDelim: '(?:\\s+|$)'
};

var Parser = function(config) {
	util.extend(this, config);
	this.player = {};
	this.orig = config.txt;
	
	this.parts = [ config.txt ];
}

Parser.prototype.parse = function() {
	var i = 0;
	
	while (this.parts.length && i < 5) {
		this._checkPart(this.parts.shift());
		i++;
	}
	
	if (i == 5 && this.parts.length)
		this.player = {};
	
	return this.player;
}

Parser.prototype._checkPart = function(part) {
	// Look for labelled level
	if (!this.player.level) {
		var exp = new RegExp(fragments.startDelim+fragments.levelSpecific+fragments.endDelim, "ig");
		var m = exp.exec(part);
		
		if (m) {
			if (m.index > 0) this.parts.push(part.substring(0, m.index));
			if (m.index + m[0].length < m.input.length) this.parts.push(part.substring(m.index + m[0].length));
			this.player.level = m[1];
			
			return;
		}
	}
	
	// Look for stats with a unit (84.2m, 975k)
	if (!this.player.defense) {
		var exp = new RegExp(fragments.startDelim+fragments.statUnits+fragments.endDelim, "ig");
		var m = exp.exec(part);
		
		if (m) {
			if (m.index > 0) this.parts.push(part.substring(0, m.index));
			if (m.index + m[0].length < m.input.length) this.parts.push(part.substring(m.index + m[0].length));
			this.player.defense = this._parseStat(m[1], m[2]);
			
			return;
		}
	}
	
	// Look for "regular" defense input, convert to millions (84.2, 22.15, 9.24)
	if (!this.player.defense) {
		var exp = new RegExp(fragments.startDelim+fragments.statCommon+fragments.endDelim, "ig");
		var m = exp.exec(part);
		
		if (m) {
			if (m.index > 0) this.parts.push(part.substring(0, m.index));
			if (m.index + m[0].length < m.input.length) this.parts.push(part.substring(m.index + m[0].length));
			this.player.defense = this._parseStat(m[1], 'm');
			
			return;
		}
	}
	
	// Look for level (250, 48, 157) - Make sure we already have a defense value or they can get confused
	if (!this.player.level && this.player.defense) {
		var exp = new RegExp(fragments.startDelim+fragments.levelCommon+fragments.endDelim, "ig");
		var m = exp.exec(part);
		
		if (m) {
			if (m.index > 0) this.parts.push(part.substring(0, m.index));
			if (m.index + m[0].length < m.input.length) this.parts.push(part.substring(m.index + m[0].length));
			this.player.level = m[1];
			
			return;
		}
	}
	
	// Look for a DL tag
	var exp = new RegExp(fragments.startDelim+fragments.dl+fragments.endDelim, "ig");var m = exp.exec(part);	
	if (m) {
		if (m.index > 0) this.parts.push(part.substring(0, m.index));
		if (m.index + m[0].length < m.input.length) this.parts.push(part.substring(m.index + m[0].length));
		this.player.dl = true;
		
		return;
	}
	
	// Maybe its the name?
	if (!this.player.name) {
		if (part.match(/\w{1,23}/)) {
			this.player.name = part;
			return;
		}
		
		if (part.match(/\S{3,11}/)) {
			this.player.name = part;
			return;
		}
		
		if (part.match(/.{4,10}/)) {
			this.player.name = part;
			return;
		}
	}
	
	this.parts.push(part);
}

Parser.prototype._trimParts = function() {
	this.parts = this.parts.filter(function(part) {
		return part.replace(/[\s\.\(\)<\-!@#\|]+/g, "").length > 0;
	});
}

Parser.prototype._parseStat = function(val, unit) {
//console.log('getting stat', val, unit);	
	if (unit == '') {
		if (/\d+\.\d+/.test(val))
			return Math.round(parseFloat(val) * 1000000);
		else
			return parseInt(val);
	} else if (unit.toLowerCase() == 'k') {
		return parseInt(val) * 1000;
	} else if (unit.toLowerCase().charAt(0) == 'm') {
		return Math.round(parseFloat(val.replace(/,/,'.')) * 1000000);
	} else if (unit.toLowerCase().charAt(0) == 'b') {
		return Math.round(parseFloat(val.replace(/,/,'.')) * 1000000000);
	}
}
