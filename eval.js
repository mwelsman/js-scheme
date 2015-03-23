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

    r7rs.builtIns = {
	'+': reduceArgs(function add (sum, n) { return sum + n; }),
	'-': reduceArgs(function add (sum, n) { return sum - n; }),
	'*': reduceArgs(function add (sum, n) { return sum * n; }),
	'/': reduceArgs(function add (sum, n) { return sum / n; })
    };

    /*
     * Create a new execution context
     */
    function _createContext (existingContext) {
	var f = new Function();
	f.prototype = existingContext || Object;
	return new f();
    };

    /*
     * The global context. Extends the built-in context
     */
    r7rs.globalContext = _createContext(r7rs.builtIns);
    // Put some stuff in the global context by default
    r7rs.globalContext.pi = 3.14159;

    /*
     * Interpret a single token as a global, number, or string
     */
    function _interpretIdentifier(identifier, context) {
	// special 'context' utility keyword
	if(identifier === 'context') {
	    return '"' + JSON.stringify(context) + '"';
	} else if(context[identifier]) {
	    return context[identifier];
	} else { // literals
	    // N.B.: only support for numbers currently
	    return Number(identifier[0]);
	}
    }

    function _treeEval(node, context) {
	// Single elements are considered identifiers
	if(!Array.isArray(node)) {
	    return _interpretIdentifier(node, context);
	}
	// Lists are not preceded by function names to be applied
	if(node.type === 'list') {
	    return node.map(function(child) { _interpretIdentifier(child, context); });
	}
	// Remaining case: s-expression with function to be applied to remaining children
	if(!node.length) {
	    throw 'Cannot execute empty expression!';
	}

	var fn = node[0];

	// Define is a base special form. It can either map a single value onto a variable
	// name, or it can map a sequence of instructions onto a procedure name and execution
	// context defined by the arguments list.
	if(fn === 'define') {
	    var names = node[1];
	    var procedure = node[2];

	    if(Array.isArray(names)) {
		// Store a procedure to be evaluated
		var name = names[0];
		var procedureArgs = names.slice(1);
		// function bind to new context
		var newFn = function () {
		    // the function's context needs to have the argument values injected
		    var fnContext = _createContext(context);
		    procedureArgs.forEach(function(arg, index) {
			fnContext[arg] = arguments[index];
		    });

		    _treeEval(procedure, fnContext);
		};
		newFn.name = name;
		newFn.args = procedureArgs;
		context[name] = newFn;
	    } else {
		// Fully evaluate and store in the context
		context[node[1]] = _treeEval(procedure, context);
	    }
	    return undefined;
	} else {
	    if(!context[fn]) {
		throw 'Unknown function name: ' + fn;
	    }
	    if(typeof context[fn] !== 'function') {
		throw 'Tried to apply a non-function: ' + fn;
	    }
	    // Prepare children
	    var args = node.slice(1).map(function(child) {
		return _treeEval(child, context);
	    });
	    // Apply the function
	    return context[fn].apply(context, args);
	}
    };

    /*
     * Constructs an AST out of a string and then evaluates it
     * Use the global context if no context is provided
     */
    r7rs.eval = function eval(str, context) {
	context = context || r7rs.globalContext;
	var tree = r7rs.tree(str);
	return _treeEval(tree, context);
    };

    /*
     * Constructs an AST out of a string consisting of numbers,
     * string literals, and potentially nested s-expressions
     */
    r7rs.tree = function tree(s) {
	var cur = undefined;
	var append = false;

	if(s[0] !== '(') {
	    return s;
	}

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
