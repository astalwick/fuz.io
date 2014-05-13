var workspace           = require('../controllers/Workspace.js')
  , helpers             = require('../libs/Helpers.js');

function getWorkspace(req, res, next) {
  console.log('getWorkspace: ' + req.params.wsId);
  // given a userid, gets the user info.

  workspace.load(req.params.wsId, function( err, workspaceDoc ) {
  
    if( err ) {
      err.where = 'getWorkspace workspace.load';
      helpers.errorResponse(res, 400, err);
      return;
    }

    if( workspaceDoc.state == 'Deleted' ) {
      err.where = 'getWorkspace';
      helpers.errorResponse(res, 400, new Error('Workspace Deleted'));
      return;
    }

    workspaceDoc.mapToClientDocument(function(err, clientDoc) {
      if( err ) {
        err.where = 'getWorkspace workspace.load workspace.mapToClientDocument';
        helpers.errorResponse(res, 400, err);
        return;
      }      

      helpers.successResponse(res, clientDoc);
    })
  });
}

exports.getWorkspace = getWorkspace;