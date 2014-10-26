var util = require('../lib/util');
var deferred = require('deferred');
var utf8 = require('utf8');

exports.create = function(group) {
	return new GroupWriter(group);
}

var GroupWriter = function(group) {
	this.def = deferred("");
	this.buf = "";
	this.group = group;
}

GroupWriter.prototype.print = function(txt) {
//console.log('printing', txt);
	var self = this;
//	console.log('[Sending Unencoded] '+txt);
	//txt = sanitize(txt);
	console.log('[Sending] '+txt);
	
	if (txt.length > 0)
		this.def = this.def.then(function() { return self.group.post(txt); });
	
	return this.def.promise;
}

GroupWriter.prototype.write = function(txt) {
//console.log('writing', txt);
	if ((this.buf.length + txt.length) > 445) {
		this.print(this.buf);
		this.buf = txt + "\n";
	} else {
		this.buf += txt + "\n";
	}
}

GroupWriter.prototype.end = function() {
//console.log('ending', this.buf);
	this.print(this.buf);	
	this.buf = "";
	return this.def;
}
