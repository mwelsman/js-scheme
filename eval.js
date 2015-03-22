/*
 * Implementation of an interpreter for r7rs scheme
 * http://trac.sacrideo.us/wg/wiki/R7RSHomePage
 */

(function (context, globalName, printFunction) {
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

    /*
     * The global context. Defines go here
     */
    r7rs.globalContext = {
    };

    /*
     * Create a new execution context
     */
    r7rs.createContext = function (existingContext) {
	var f = new Function();
	f.prototype = existingContext || Object;
	return new f();
    };

    r7rs.builtIns = {
	'+': reduceArgs(function add (sum, n) { return sum + n; }),
	'-': reduceArgs(function add (sum, n) { return sum - n; }),
	'*': reduceArgs(function add (sum, n) { return sum * n; }),
	'/': reduceArgs(function add (sum, n) { return sum / n; }),
	'print': printFunction,
	'set!': function setBuiltIn (target, value) {
	    if(arguments.length !== 2) {
		throw 'Wrong number of arguments';
	    }
	    if(!this.hasOwnProperty(target)) {
		throw 'Must define global before it can be set';
	    }
	    this[target] = value;
	    return value;
	}
    };

    r7rs.isIdentifier = function isIdentifier(s) {
	return r7rs.regex.identifier.exec(s) !== null;
    };

    /*
     * Interpret a single token as a global, number, or string
     */
    function _interpretToken(identifier, fn, argIndex, context) {
	// special 'context' utility keyword
	if(identifier === 'context') {
	    return JSON.stringify(context);
	} else if((fn === 'define' || fn === 'set!') && argIndex === 0) {
	    return identifier;
	} else if(context[identifier]) {
	    return context[identifier];
	} else {
	    // Perform literal conversion. Currently only number or string
	    return Number(identifier[0]) ? Number(identifier): identifier;
	}
    }

    /*
     * Constructs an AST out of a string and then evaluates it
     */
    r7rs.eval = function eval(str, context) {
	context = context || r7rs.globalContext;

	// Can just be a single token
	if(str[0] !== '(') {
	    return _interpretToken(str, str, 0, context);
	}
	var tree = r7rs.tree(str);

	return (function recursiveEval(list) {
	    var fn = list[0];

	    function evalOrRecurse(arg, index, array) {
		return Array.isArray(arg) ?  recursiveEval(arg)
		    : _interpretToken(arg, fn, index, context);
	    }
	    // FIXME: define doesn't work quite right. How does it
	    //        relate to the global context?
	    if(fn === 'define') {
		var name = list[1], value = list[2];

		context[list[1]] = r7rs.eval(list[2]);
		// continue execution
		var results = list.slice(3).map(evalOrRecurse);
		if(results) {
		    return results[results.length -1];
		} else {
		    return undefined;
		}
	    } else {
		var args = list.slice(1).map(evalOrRecurse);
		return r7rs.builtIns[list[0]].apply(context, args);
	    }
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
})(window, 'r7rs', function printToTerminal () {
    var term = window.jQuery.terminal.active();
    term.echo.apply(term, arguments);
});
