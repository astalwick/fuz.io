var workspace       = require('../controllers/Workspace')
  , helpers         = require('../libs/Helpers.js')
  ;

function getUsersInWorkspace(req, res, next) {
  console.log('getUsersInWorkspace: ' + req.params.wsId);

  workspace.listUsers(req.params.wsId, function(err, users) {
    
    if( err ) {
      err.where = 'getUsersInWorkspace workspace.listUsers';
      helpers.errorResponse(res, 400, err);
      return;
    }

    helpers.successResponse(res, users);
  });
}

exports.getUsersInWorkspace = getUsersInWorkspace;
