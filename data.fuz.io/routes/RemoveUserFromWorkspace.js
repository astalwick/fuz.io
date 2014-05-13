var workspace           = require('../controllers/Workspace.js')
  , helpers             = require('../libs/Helpers.js');


function removeUserFromWorkspace(req, res, next) {
  console.log('removeUserFromWorkspace: ' + req.params.wsId + ' ' + req.params.userId)

  workspace.removeUser(req.params.wsId, req.params.userId, function(err, result) {
    
    if( err ) {
      err.where = 'removeUserFromWorkspace workspace.removeUser';
      helpers.responseError(res, 400, err)
      return;
    }

    helpers.successResponse(res, {})
  });
}
exports.removeUserFromWorkspace = removeUserFromWorkspace;