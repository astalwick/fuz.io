var user                = require('../controllers/User.js')
  , helpers             = require('../libs/Helpers.js');

function getUser(req, res, next) {
  console.log('getUser: ' + req.params.userId);
  // given a userid, gets the user info.
  
  user.load(req.params.userId, function( err, userDoc ) {
  
    if(err) {
      err.where = 'getUser user.load';
      helpers.errorResponse(res, 400, err);
      return;
    }

    userDoc.mapToClientDocument(function(err, clientDoc) {
      if( err ) {
        err.where = 'getUser user.load userDoc.mapToClientDocument';
        helpers.errorResponse(res, 400, err);
        return;
      }      
      helpers.successResponse(res, clientDoc);
    })
  });
}

exports.getUser = getUser;