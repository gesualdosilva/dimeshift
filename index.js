var CookieParser = require('restify-cookies');
var restify = require('restify');
var rfr = require('rfr');
var db = rfr('includes/models');
var routes = rfr('includes/routes');
var servers = rfr('includes/servers');

var server = restify.createServer({
  name: 'DimeShift',
});

server.pre(restify.pre.sanitizePath());
server.on('uncaughtException', function (req, res, route, err) 
{
	try {
		res.json(500, err);
	} catch (e) {
		res.end();
	}
	return true;
});
db.Sequelize.Promise.onPossiblyUnhandledRejection(function(reason) {
	throw reason;
});

server.use(CookieParser.parse);
server.use(restify.queryParser());
server.use(restify.bodyParser());

routes(function(routes){
	routes.forEach(function(route){
		server[route.method](route.route, route.handler);
	});
});

server.get(/jstemplates\/?.*/, servers['static_file_server']({ directory: './public', suffix: '.tpl' }));
server.get(/images\/?.*/, servers['images_server']());

server.get('/resources/js.js', servers['minify_server']('javascript'));
server.get('/resources/css.css', servers['minify_server']('css'));


var index = restify.serveStatic({
  directory: './public',
  file: 'index.html'
});

server.get('/\/?.*/', index);
server.get('wallets', index);
server.get('profile', index);
server.get('wallets/:wallet_id', index);
server.get('wallets/:wallet_id/import', index);
server.get('user/newpassword', index);
server.get('user/updatepassword/:code/:hash', index);

server.get(/\/scripts\/?.*/, restify.serveStatic({
  directory: './public'
}));
server.get(/\/vendors\/?.*/, restify.serveStatic({
  directory: './public'
}));

db.sequelize.sync()
.then(function(err) {
    var port = process.env.PORT || 8080;
	server.listen(port);
	console.log("Server started: http://localhost:"+port+"/");
});