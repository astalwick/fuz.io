
/**
 * Module dependencies.
 */

var express       = require('express')
  , jade_browser  = require('jade-browser')
  , redisstore    = require('connect-redis')(express)
  , siteconfig    = require('./Config.js')
  , broadcast     = require('./libs/Broadcast.js')
  , http          = require('http')

console.log('site server init - siteURL: ' + siteconfig.url);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('/views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.methodOverride());
  app.use(express.cookieParser("1CrH+Kk0IIX3P"));
  app.use(express.session({ secret: "1CrH+Kk0IIX3P", store: new redisstore({host:siteconfig.redisHost}), cookie: {maxAge: 31 * 24 *  60 * 60 * 1000 } }));
  app.use(app.router);
  app.use('/', express.static(__dirname + '/'));
  app.use(jade_browser('/views/templates.js', '*.client.jade', { root: __dirname + '/views' }));
  app.set('view options', {
    layout: false
  });
});

broadcast.register(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', express.bodyParser(), function(req, res, next) {
  res.render('main.view.jade', {siteURL: siteconfig.url});
});

app.get('/:workspaceId', express.bodyParser(), function(req, res, next) {
  res.render('main.view.jade', {siteURL: siteconfig.url});
});

// this proxies all api requests to the UI server off over to the data server.
// NOTE THAT in production, haproxy does this work.
// this is really just for dev. 
// (reason why it's necessary: data server sets the auth cookie, and can't
// do that from a different port - cross domain cookies aren't allowed)
app.get('/api/*', proxy)
app.post('/api/*', proxy)
app.delete('/api/*', proxy)
app.put('/api/*', proxy)

function proxy(req, res, next) {
  console.log('proxy begin', req.method, req.url)

  req.on('error', function() {'client request error', arguments})
  res.on('error', function() {'client response error', arguments})
  req.pause();
  var options = {
    hostname: req.headers['host'],
    port: siteconfig.dataServerPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  var connector = http.request(options, function(serverResponse) {
    serverResponse.pause();
    res.writeHeader(serverResponse.statusCode, serverResponse.headers);
    serverResponse.pipe(res);
    serverResponse.resume();
    serverResponse.on('error', function() {'server response error', arguments})
  });
  connector.on('error', function() {'server request error', arguments})
  

  req.pipe(connector);
  req.resume();
}

app.listen(siteconfig.port);
console.log("Express server listening ", siteconfig.port);
if(siteconfig.isDev)
  console.log('DEV MODE')