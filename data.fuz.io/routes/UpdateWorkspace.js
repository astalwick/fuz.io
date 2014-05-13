var workspace                 = require('../controllers/Workspace.js')
  , helpers                   = require('../libs/Helpers.js');

function updateWorkspace(req, res, next) {
  workspace.updateWorkspaceTitle(req.params.wsId, req.body.title, function(err, result){

    if( err ) {
      err.where = 'updateWorkspace workspace.updateWorkspaceTitle';
      helpers.errorResponse(res, 400, err);
      return;
    }

    helpers.successResponse(res, {})
  });
}

exports.updateWorkspace = updateWorkspace;