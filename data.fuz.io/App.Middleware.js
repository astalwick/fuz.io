var url           = require('url')
  , cookies       = require('cookies')
  , keys          = require('./libs/Keys.js')
  , siteconfig    = require('./Config.js')
  , helpers       = require('./libs/Helpers.js')
  , routes        = require('./routes/Routes.js')
  , user          = require('./controllers/User.js')
  ;

exports.methodOverride = function methodOverride(req, res, next) {
  if( req.method == 'POST' ) {
    if( req.headers['x-http-method-override'] ) {
      req.method = req.headers['x-http-method-override'];
    }
  } 

  next();
}

exports.queryParser = function queryParser(req, res, next) {
  req.query = url.parse(req.url, true).query;
  next();
}

exports.loginAuth = function(request, response, fn) {
  return exports.authenticate(request, response, true, fn);
}

exports.authenticate = function( request, response, allowFailure, fn ) {
  if( typeof allowFailure === 'function') {
    fn = allowFailure;
    allowFailure = false;
  }

  // get it from the cookie.
  var cookieJar         = new cookies(request, response, keys),
      auth = cookieJar.get('auth' , { signed : true }),
      parts,
      authuid,
      authToken;

  if(auth) {
    auth = new Buffer(auth, 'base64').toString();    // convert from base64
    parts = auth.split(/:/)     ;                     // split on colon    
    authuid = parts[0];
    authToken = parts[1];
  }
  // do it!
  user.verifyAuthToken(authuid, authToken, function(err, authenticated) {

    if (err && !allowFailure) {
      console.log('AUTH FAILED 401 - ' + JSON.stringify(err) + ' --- authuid: ' + authuid + ' authToken: ' + authToken);
      response.writeHead(401,  helpers.jsonHeaders());
      response.write(JSON.stringify(['authfailed', 'not authenticated', 'authenticate', err]));
      response.end();
      return;
    }

    if( authenticated ) {
      request.authenticated_uid = authuid;
      fn();
    }
    else if( allowFailure ) {
      // we're not authenticated, but the request can happen anyway.
      fn();
    }
    else {
      // nope, failed.
      console.log('AUTH FAILED 401 - not authenticated!! - ' + JSON.stringify(err));
      response.writeHead(401,  helpers.jsonHeaders());
      response.write(JSON.stringify(['authfailed', 'not authenticated', 'authenticate', err]));
      response.end();
      return;
    }
  });
}
