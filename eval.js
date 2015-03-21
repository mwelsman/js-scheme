/*
 * Implementation of an interpreter for r7rs scheme
 * http://trac.sacrideo.us/wg/wiki/R7RSHomePage
 */

(function (context, globalName) {
    var r7rs = {
	regex: {
	    // Identifiers are case insensitive. They may begin with the letters a-z
	    // or a character from the extended set, !$%&*+-./:<=>?@^_~
	    // Digits 0-9 may be used after the first character
	    identifier: /^[a-zA-Z!$%&*+-./:<=>?@^_~]+[a-zA-Z0-9!$%&*+-./:<=>?@^_~]$/,
	    singleLevelParen: /\([^)]*\)/g, // one level of paren matching
	    comment: /;/

	}
    };
    context[globalName] = r7rs;

    function reduceArgs(reduceFunction) {
	return function () {
	    return Array.prototype.slice.call(arguments).reduce(reduceFunction);
	};
    };

    r7rs.globalContext = {
    };

    r7rs.builtIns = {
	'+': reduceArgs(function add (sum, n) { return sum + n; }),
	'-': reduceArgs(function add (sum, n) { return sum - n; }),
	'*': reduceArgs(function add (sum, n) { return sum * n; }),
	'/': reduceArgs(function add (sum, n) { return sum / n; }),
	'print': console.log.bind(console),
	'define': function defineBuiltIn (target, value) {
	    if(arguments.length !== 2) {
		throw 'Wrong number of arguments';
	    }
	    if(r7rs.globalContext[target]) {
		throw 'Cannot redefine existing global';
	    }
	    r7rs.globalContext[target] = value;
	    return value;
	},
	'set!': function setBuiltIn (target, value) {
	    if(arguments.length !== 2) {
		throw 'Wrong number of arguments';
	    }
	    if(!r7rs.globalContext.hasOwnProperty(target)) {
		throw 'Must define global before it can be set';
	    }
	    r7rs.globalContext[target] = value;
	    return value;
	},
	'globals': function printGlobals() {
	    if(arguments.length) {
		throw 'Wrong number of arguments (expected 0)';
	    }
	    return JSON.stringify(r7rs.globalContext);
	}
    };

    r7rs.isIdentifier = function isIdentifier(s) {
	return r7rs.regex.identifier.exec(s) !== null;
    };

    /*
     * Interpret a single identifier as a global, number, or string
     * TODO: add more possible values
     */
    function _interpretIdentifier(identifier, functionContext, argIndex) {
	// FIXME: have a better system for built-ins that use different evaluation
	if((functionContext === 'define' || functionContext === 'set!') && argIndex === 0) {
	    return identifier;
	} else if(r7rs.globalContext[identifier]) {
	    return r7rs.globalContext[identifier];
	} else {
	    // Perform literal conversion. Currently only number or string
	    return Number(identifier[0]) ? Number(identifier): identifier;
	}
    }

    /*
     * Constructs an AST out of a string and then evaluates it
     */
    r7rs.eval = function eval(str) {
	var tree = r7rs.tree(str);

	return (function recursiveEval(list) {
	    var fn = list[0];
	    var args = list.slice(1).map(function(arg, index, array) {
		return Array.isArray(arg) ?  recursiveEval(arg)
		    : _interpretIdentifier(arg, fn, index);
	    });
	    return r7rs.builtIns[list[0]].apply(null, args);
	})(tree);
    };

    /*
     * Constructs an AST out of a string consisting of numbers,
     * string literals, and potentially nested s-expressions
     */
    r7rs.tree = function tree(s) {
	var cur = undefined;
	var append = false;

	s.split('').forEach(function(c) {
	    switch(c) {
	    case '(':
		var newNode = [cur];
		if(cur) {
		    cur.push(newNode);
		}
		cur = newNode;
		append = false;
		break;
	    case ')':
		if(cur[0]) {
		    var old = cur;
		    cur = cur[0];
		    old.shift(); // get rid of the old parent reference
		}
		append = false;
		break;
	    default:
		if(c.match(/[ ]/)) {
		    append = false; // start a new token
		    break;
		}
		append ? cur[cur.length - 1] += c : cur.push(c);
		append = true;
		break;
	    }
	});
	cur.shift();
	return cur;
    };
})(window, 'r7rs');
