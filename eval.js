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

    r7rs.builtIns = {
	'+': reduceArgs(function add (sum, n) { return sum + Number(n); }),
	'-': reduceArgs(function add (sum, n) { return sum - Number(n); }),
	'*': reduceArgs(function add (sum, n) { return sum * Number(n); }),
	'/': reduceArgs(function add (sum, n) { return sum / Number(n); }),
	'print': console.log.bind(console)
    };

    r7rs.isIdentifier = function isIdentifier(s) {
	return r7rs.regex.identifier.exec(s) !== null;
    };

    r7rs.eval = function eval(list) {
	var args = list.slice(1).map(function convert(item) {
	    if (Array.isArray(item)) {
		return eval(item);
	    } else {
		// Perform number conversion
		return Number(item[0]) ? Number(item): item;
	    }
	});
	return r7rs.builtIns[list[0]].apply(null, args);
    };

    // Build a tree out of nested s-expressions
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

    // Find one level of identifiers and s-expressions
    r7rs.superTokenize = function superTokenize(exp) {
	var sRegex = new RegExp(r7rs.regex.singleLevelParen);
	var match, indices = [];
	while ((match = sRegex.exec(exp))) {
	    indices.push([match.index, match.index+match[0].length]);
	}
	if(!indices.length) {
	    return [exp]; // one big token
	}
	var last = 0, result = [];
	indices.forEach(function(indexRange) {
	    if(last < indexRange[0]) {
		result.push(exp.substr(last, indexRange[0] - last).trim());
	    }
	    result.push(exp.substr(indexRange[0], indexRange[1]).trim());
	    last = indexRange[1];
	});
	return result.filter(function(token) { return !!token; });
    };

    r7rs.stripExpression = function strip(sexp) {
	var s = sexp.trim().replace('\n', '');
	if(s[0] !== '(' || s[s.length - 1] !== ')') {
	    return undefined;
	}
	return s.substr(1, s.length - 2);
    };

    r7rs.matchParen = function matchParen(sexp) {
	var sum = 0;
	sexp.split('').forEach(function(c) {
	    if (c === '(') {
		sum++;
	    } else if (c === ')') {
		sum--;
	    }

	    if(sum < 0) {
		throw 'Closed too many parens';
	    }
	});
	if(sum > 0) {
	    throw 'Failed to close all parens';
	}
    };

    r7rs.treeify = function treeify(exp) {
	if(!exp.trim()) {
	    console.log('empty', exp);
	    return null; // empty
	}
	if(r7rs.isIdentifier(exp)) {
	    console.log('found an identifier', exp);
	    return exp;
	} else {
	    var s = r7rs.stripExpression(exp);
	    console.log('interpreting as expression with contents', s);

	    if(!s) {
		throw 'Neither animal, mineral, nor vegetable';
	    }

	    // FIXME: doesn't handle recursion with some s-exps, some identifiers
	    // FIXME: whitespace needs to be stripped so it doesn't result in more
	    //        nodes!
	    var result = [];
	    r7rs.superTokenize(s).forEach(function(token) {
		result.push(treeify(token));
	    });
	    console.log('treeify result', result);
	    return result;
	}
    };

    r7rs.execute = function execute(sexp) {
	// treeify
	// walk tree and call
	// eval('');
	// built-ins?
    };

    // Constructor for a new evaluation context
    function Context() {
    }
})(window, 'r7rs');
