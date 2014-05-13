var user                = require('../controllers/User.js')
  , helpers             = require('../libs/Helpers.js');

function updateUser(req, res, next) {
  console.log('updateUser: ' + req.params.userId);
  // given a req.params.userId, gets the user info.
  
  user.updateUser(req.params.userId, req.body.email, req.body.userName, req.body.password, function(err, result) {

    if( err ) {
      err.where = 'updateUser user.updateUser';
      helpers.errorResponse(res, 400, err);
      return;
    }

    helpers.successResponse(res, {})
  });
}

exports.updateUser = updateUser;