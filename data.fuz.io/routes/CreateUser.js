var user            = require('../controllers/User.js')
  , helpers         = require('../libs/Helpers.js')
  ;

function createAnonymousUser(req, res, next) {
  console.log( "createAnonymousUser: " + JSON.stringify(req.body));
  
  if (!req.body.anonymous) {
    var err = new Error('Non-anonymous user creation not supported');
    err.where = 'createAnonymousUser';

    helpers.errorResponse(res, 400, err)
    return;
  }
  
  user.createUser(function(err, u) {        
    if(err) {
      err.where = 'createAnonymousUser user.createUser';
      helpers.errorResponse(res, 400, err);
      return;
    }

    console.log("create user response: " + JSON.stringify({id: u._id, authToken: u.authToken}));
    helpers.successResponse(res, {id: u._id, authToken: u.authToken})
  });
}
exports.createUser = createAnonymousUser;