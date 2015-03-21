jQuery(function($, undefined) {
    $('#term').terminal(function(command, term) {
	if (command !== '') {
	    var result = r7rs.eval(command);
	    if (result != undefined) {
		term.echo(String(result));
	    }
	}
    }, {
	greetings: 'Scheme Interpreter',
	name: 'scheme_demo',
	height: 800,
	width: 1000,
	prompt: 'scheme> '});
});
