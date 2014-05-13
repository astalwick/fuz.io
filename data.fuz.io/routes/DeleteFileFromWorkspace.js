var workspace   = require('../controllers/Workspace.js')
  , helpers     = require('../libs/Helpers.js')

function deleteFileFromWorkspace(req, res, next) {
  console.log( "deleteFileFromWorkspace: " + req.params.wsId + '/' + req.params.fileId);
  
  workspace.deleteFile(req.params.wsId, req.params.fileId, function(err, res) {

    if (err) {
      err.where = 'deleteFileFromWorkspace workspace.deleteFile';
      helpers.errorResponse(res, 400, err);
      return;
    }

    helpers.successResponse(res, {})
  });
}
exports.deleteFileFromWorkspace = deleteFileFromWorkspace;