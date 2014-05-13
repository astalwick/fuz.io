var user            = require('../controllers/User.js')
  , helpers         = require('../libs/Helpers.js')
  , cookies         = require('cookies')
  , keys            = require('../libs/Keys.js')  
  ;

function signUp(req, res, next) {

  console.log('signUp: ' + req.params.userId + ' ' + JSON.stringify(req.body));

  user.signup(req.params.userId, req.body.email, req.body.username, req.body.fullname, req.body.password, function(err, signupResult) {
    signupCallback(err, req, res, signupResult)
  });
}

function signupCallback(err, req, res, signupResult) {
  if (err) {
    err.where = 'signUp signupCallback';
    helpers.errorResponse(res, 400, err)
    return;
  }

  console.log('200 response from login')
  console.log(signupResult);

  var cookieJar         = new cookies(req, res, keys)
  console.log('login setting auth token')
  var expires = new Date();
  expires.setMonth(expires.getMonth+1)
  cookieJar.set('auth' , new Buffer(signupResult.id + ':' + signupResult.authToken).toString('base64'), { signed : true, domain: '.fuz.io', httpOnly: false, expires: expires })

  helpers.successResponse(res, {id: signupResult.id})
}
exports.signUp = signUp;