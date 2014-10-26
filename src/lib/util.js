var deferred = require('deferred');
var moment = require('moment');

exports.formatStat = function(num) {
	if (num >= 1000000000) {
		return Math.round(num / 10000000) / 100 + "b";
	} else if (num >= 1000000) {
		return Math.round(num / 10000) / 100 + "m";
	} else if (num >= 1000) {
		return Math.round(num / 1000) + "k";
	} else {
		return num;
	}
}

exports.formatStats = function(player) {
	var after = moment().subtract(3, 'days');
	var stats = player.stats;
	var str = "";
	
	if (stats) {
		if (stats.dl) str += "**DL** ";
		if (stats.level) str += stats.level+" "
		str += player.name+" ";
		if (stats.attack)
			str += exports.formatStat(stats.attack) + " / "
		str += exports.formatStat(stats.defense)+" ";
		if (after.isAfter(stats.created))
			str += "("+moment(stats.created).calendar()+") ";
	} else {
		str = player.name;
	}
	
	return str;
}

exports.parseStat = function(val, unit) {
//console.log('getting stat', val, unit);	
	val = val.replace(/,/g, '');

	if (unit == '') {
		if (/\d+\.\d+/.test(val))
			return Math.round(parseFloat(val) * 1000000);
		else
			return parseInt(val);
	} else if (unit.toLowerCase() == 'k') {
		return parseInt(val) * 1000;
	} else if (unit.toLowerCase().charAt(0) == 'm') {
		return Math.round(parseFloat(val.replace(/,/,'.')) * 1000000);
	}
}

exports.formatTimeTo = function(date) {	
	var msTo = Math.abs(date.valueOf()-(new Date()).valueOf()),
		tenMin = 1000*60*10;
//console.log(date, msTo, tenMin);	
	if (msTo < tenMin) {
		return Math.floor(msTo/(1000*60))+' minutes '+Math.floor((msTo%60000)/1000)+' seconds'
	} else {
		return Math.round(msTo/60000)+' minutes'
	}
}

exports.getSearch = function(term) {
//console.log(term);
	return term.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()
}

exports.unicodeEscape = function(str) {
  return str.replace(/[\s\S]/g, function (escape) {
    return '\\u' + ('0000' + escape.charCodeAt().toString(16)).slice(-4);
  });
}

exports.extend = function() {
	var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
     i = 1,
     length = arguments.length,
     deep = false,
     toString = Object.prototype.toString,
     hasOwn = Object.prototype.hasOwnProperty,
     push = Array.prototype.push,
     slice = Array.prototype.slice,
     trim = String.prototype.trim,
     indexOf = Array.prototype.indexOf,
     class2type = {
       "[object Boolean]": "boolean",
       "[object Number]": "number",
       "[object String]": "string",
       "[object Function]": "function",
       "[object Array]": "array",
       "[object Date]": "date",
       "[object RegExp]": "regexp",
       "[object Object]": "object"
     },
     jQuery = {
       isFunction: function (obj) {
         return jQuery.type(obj) === "function"
       },
       isArray: Array.isArray ||
       function (obj) {
         return jQuery.type(obj) === "array"
       },
       isWindow: function (obj) {
         return obj != null && obj == obj.window
       },
       isNumeric: function (obj) {
         return !isNaN(parseFloat(obj)) && isFinite(obj)
       },
       type: function (obj) {
         return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
       },
       isPlainObject: function (obj) {
         if (!obj || jQuery.type(obj) !== "object" || obj.nodeType) {
           return false
         }
         try {
           if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
             return false
           }
         } catch (e) {
           return false
         }
         var key;
         for (key in obj) {}
         return key === undefined || hasOwn.call(obj, key)
       }
     };
   if (typeof target === "boolean") {
     deep = target;
     target = arguments[1] || {};
     i = 2;
   }
   if (typeof target !== "object" && !jQuery.isFunction(target)) {
     target = {}
   }
   if (length === i) {
     target = this;
     --i;
   }
   for (i; i < length; i++) {
     if ((options = arguments[i]) != null) {
       for (name in options) {
         src = target[name];
         copy = options[name];
         if (target === copy) {
           continue
         }
         if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
           if (copyIsArray) {
             copyIsArray = false;
             clone = src && jQuery.isArray(src) ? src : []
           } else {
             clone = src && jQuery.isPlainObject(src) ? src : {};
           }
           // WARNING: RECURSION
           target[name] = extend(deep, clone, copy);
         } else if (copy !== undefined) {
           target[name] = copy;
         }
       }
     }
   }
   return target;
 }