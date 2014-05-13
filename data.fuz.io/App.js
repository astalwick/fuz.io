var http          = require('http')
  , mongoose      = require('mongoose')
  , connect       = require('connect')
  , urlrouter     = require('urlrouter')
  , siteconfig    = require('./Config.js')
  , helpers       = require('./libs/Helpers.js')
  , routes        = require('./routes/Routes.js')
  , middleware    = require('./App.Middleware.js')
  ;

console.log('Data server init - siteURL: ' + siteconfig.url);

// init up the database
mongoose.connect('mongodb://' + siteconfig.mongoHost + '/' + siteconfig.mongoDbName);
mongoose.connection.on('error', function(err) {
  console.log(err);
  process.exit(1);
});

http.globalAgent.maxSockets = siteconfig.maxSockets;

// start the server
var server = connect();

server.use(middleware.methodOverride)
      .use(urlrouter(fileUploadRouter))
      .use(connect.bodyParser())
      .use(middleware.queryParser)
      .use(urlrouter(router))
      .listen(siteconfig.port)
      .addListener('error', function(err){
        console.log(JSON.stringify(err));
        process.exit(1);
      });

// we put this in it's own router function so that we can
// add it to the midddleware stack BEFORE bodyparsing happens.
function fileUploadRouter(app) {
  app.post('/api/ws/:wsId/files', middleware.authenticate, routes.postFileToWorkspace);
}

function router(app) {
  app.put('/api/ws/:wsId', middleware.authenticate, routes.updateWorkspace);

  app.post('/api/u', routes.createUser);
  app.post('/api/ws', middleware.authenticate, routes.createWorkspace);
  app.post('/api/ws/:wsId/users', middleware.authenticate, routes.addUserToWorkspace);
  app.post('/api/u/login', middleware.loginAuth, routes.login);
  app.post('/api/u/fbloginsignup', middleware.loginAuth, routes.fbLoginSignup);
  app.post('/api/u/:userId/logout', middleware.authenticate, routes.logout);
  app.post('/api/u/:userId/signup', middleware.authenticate, routes.signUp);
  app.post('/api/u/:userId', middleware.authenticate, routes.updateUser);

  app.get('/api/ws/:wsId', middleware.authenticate, routes.getWorkspace);
  app.get('/api/ws/:wsId/files', middleware.authenticate, routes.getFilesInWorkspace);
  app.get('/api/ws/:wsId/users', middleware.authenticate, routes.getUsersInWorkspace);
  app.get('/api/ws/:wsId/files/:fileId/:fileName', middleware.authenticate, routes.getFileFromWorkspace);
  app.get('/api/u/me', middleware.loginAuth, routes.getMe);  
  app.get('/api/u/:userId', middleware.authenticate, routes.getUser);  

  app.delete('/api/ws/:wsId', middleware.authenticate, routes.deleteWorkspace);
  app.delete('/api/ws/:wsId/users/:userId', middleware.authenticate, routes.removeUserFromWorkspace);
  app.delete('/api/ws/:wsId/files/:fileId', middleware.authenticate, routes.deleteFileFromWorkspace);

  /* Miscellaneous non-api routes */
  app.get('/favicon.ico', routes.favIcon); 
  app.get('/', routes.redirNonApi);
  app.get('', routes.redirNonApi);

  app.options('*', routes.options);

  app.get('*', routes.fourOhFour); 
}

console.log('LISTENING on port', siteconfig.port)
if(siteconfig.isDev)
  console.log('DEV MODE')