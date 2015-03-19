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
	    comment: /;/
	}
    };
    context[globalName] = r7rs;

    r7rs.isIdentifier = function isIdentifier(s) {
	return r7rs.regex.identifier.exec(s) !== null;
    };

    // TODO: function to pull out one level of s-expressions and identifiers

    r7rs.tokenize = function tokenize(s) {
	return s.match(/\S+/g);
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
	// TODO: could be other built-ins, etc.
	if(r7rs.isIdentifier(exp)) {
	    return exp;
	} else {
	    if(exp[0] !== '(' || exp[exp.length - 1] !== ')') {
		throw exp;
	    }

	    var result = [];
	    // FIXME: tokenize isn't enough to break down into s-exps! It only works inside
	    // of a known s-exp!
	    this.tokenize(exp.substr(1, exp.length - 2)).forEach(function(token) {
		result.push(treeify(token));
	    });
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
