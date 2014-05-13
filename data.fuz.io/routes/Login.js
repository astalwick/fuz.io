var user            = require('../controllers/User.js')
  , helpers         = require('../libs/Helpers.js')
  , cookies         = require('cookies')
  , keys            = require('../libs/Keys.js')

  ;

function login(req, res, next) {
  console.log('login: ' + JSON.stringify(req.body))

  if( req.body.anonuid != req.authenticated_uid )  {
    var err = new Error('BAD UID');
    helpers.errorResponse(401, err)
    return;
  }

  console.log('beginning normal user login');
  user.login( 
      req.authenticated_uid
    , req.body.email
    , req.body.userNam
    , req.body.password
    , function(err, loginResult) { 
        loginResponseCallback(err, req, res, loginResult) 
      });
}

function fbLoginSignup(req, res, next) {
  console.log('fbLoginSignup: ' + JSON.stringify(req.body))

  if( req.body.userid != req.authenticated_uid )  {
    var err = new Error('BAD UID');
    helpers.errorResponse(res, 401, err)
    return;
  }

  console.log('beginning fbloginsignup');
  user.fbLoginSignup(
      req.authenticated_uid
    , req.body.fbInfo
    , req.body.fbAccessToken
    , function(err, loginResult) { 
        loginResponseCallback(err, req, res, loginResult); 
    })
}

function loginResponseCallback(err, req, res, loginResult) {
  if (err) {
    err.where = 'loginResponseCallback';
    helpers.errorResponse(res, 400, err)
    return;
  }

  console.log('200 response from login')
  console.log(loginResult);

  var cookieJar         = new cookies(req, res, keys)
  console.log('login setting auth token')
  var expires = new Date();
  expires.setMonth(expires.getMonth+1)  
  cookieJar.set('auth' , new Buffer(loginResult.id + ':' + loginResult.authToken).toString('base64'), { signed : true, domain: '.fuz.io', httpOnly: false, expires: expires })

  helpers.successResponse(res, {id: loginResult.id})
}
exports.login = login;
exports.fbLoginSignup = fbLoginSignup;