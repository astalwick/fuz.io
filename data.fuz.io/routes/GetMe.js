var user                = require('../controllers/User.js')
  , workspace           = require('../controllers/Workspace.js')
  , helpers             = require('../libs/Helpers.js')
  , cookies             = require('cookies')
  , keys                = require('../libs/Keys.js')  

function getMe(req, res, next) {
  console.log('getMe');
  // given a userid, gets the user info.

  var callback = function( err, userDoc ) {
    if(err) {
      err.where = 'getMe callback';
      helpers.errorResponse(res, 400, err);
      return;
    }

    var cookieJar         = new cookies(req, res, keys)
    var expires = new Date();
    expires.setMonth(expires.getMonth+1);
    
    userDoc.mapToClientDocument(function(err, clientDoc) {
      if(err) {
        err.where = 'getMe callback userDoc.mapToClientDocument';
        helpers.errorResponse(res, 400, err);
        return;
      }
      cookieJar.set('auth' , new Buffer(userDoc.id + ':' + userDoc.authToken).toString('base64'), { signed : true, domain: '.fuz.io', httpOnly: false, expires: expires })
      helpers.successResponse(res, clientDoc)
    });

  }

  if(req.authenticated_uid) {
    user.load(req.authenticated_uid, callback);
  } else {
    user.createUser(function(err, u) {
      if(err) return callback(err);
      workspace.createWorkspace(u._id, "Empty Workspace", function(err) {
        if(err) return callback(err);
        // reload the user.
        user.load(u._id, callback);
      });
    });
  }
}

exports.getMe = getMe;