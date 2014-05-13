var user            = require('../controllers/User.js')
  , helpers         = require('../libs/Helpers.js')
  ;

function logout(req, res, next) {
  console.log('logout: ' + uid)

  if( req.params.userId != req.authenticated_uid )  {
    var err = new Error('BAD UID');
    helpers.errorResponse(res, 401, err)
    return;
  }

  
  user.logout(uid, function(err, res) {
    if (err) {
      err.where = 'logout user.logout';
      helpers.errorResponse(res, 401, err)
      return;
    }

    helpers.successResponse(res, {});
  });
}
exports.logout = logout;