var workspace       = require('../controllers/Workspace')
  , helpers         = require('../libs/Helpers.js')
  ;

function deleteWorkspace(req, res, next) {
  console.log('deleteWorkspace: ' + req.params.wsId);
  
  workspace.deleteWorkspace(req.params.wsId, function( err, res ) {
    if(err) {
      err.where = 'deleteWorkspace workspace.deleteWorkspace';
      helpers.errorResponse(res, 400, err);
      return;
    }
    console.log('destroyed workspace: ' + req.params.wsId);
    helpers.successResponse(res, {})
  });
}

exports.deleteWorkspace = deleteWorkspace;