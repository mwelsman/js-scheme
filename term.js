jQuery(function($, undefined) {
    function contextToTreeRepresentation(context) {
	var data = [];
	for(p in r7rs.globalContext) {
	    data.push({
		label: p, // + ': ' + r7rs.globalContext[p],
		children: [{
		    label: JSON.stringify(r7rs.globalContext[p])
		}]
	    });
	}
	return data;
    };

    var initialTreeRender = true;

    function refreshTreeRepresentation(context) {
	var tree = contextToTreeRepresentation(context);
	var $tree = $('#environment-tree');

	if(initialTreeRender) {
	    $tree.tree({
		data: tree
	    });
	    initialTreeRender = false;
	} else {
	    $tree.tree('loadData', tree);
	}
	// display all nodes as open by default
	$tree.tree('getTree').iterate(
	    function(node, level) {
		if (! node.hasChildren()) {
		    // This will open the folder
		    $tree.tree('selectNode', node);
		    return false;
		}
		return true;
	    }
	);
    }

    $('#term').terminal(function(command, term) {
	if (command !== '') {
	    var result = r7rs.eval(command);
	    if (result != undefined) {
		term.echo(String(result));
	    }
	    refreshTreeRepresentation(r7rs.globalContext);
	}
    }, {
	greetings: 'Scheme Interpreter',
	name: 'scheme_demo',
	height: 800,
	width: 1000,
	prompt: 'scheme> '});

    refreshTreeRepresentation(r7rs.globalContext);
});
