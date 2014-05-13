// createworkspace
var workspace       = require('../controllers/Workspace.js')
  , helpers         = require('../libs/Helpers.js')
  ;

function createWorkspace(req, res, next) {
  console.log( "createWorkspace: " + JSON.stringify(req.body));

  var title =  req.body.title ? req.body.title : 'Empty Workspace'
    ;

  workspace.createWorkspace(req.authenticated_uid, title, function(err, result) {
    if (err) {
      err.where = 'createWorkspace workspace.createWorkspace';
      return helpers.errorResponse(res, 400, err);
    }

    result.mapToClientDocument(function(err, clientDoc) {
      if (err) {
        err.where = 'createWorkspace workspace.createWorkspace result.mapToClientDocument'
        return helpers.errorResponse(res, 400, err);
      }      

      console.log('created workspace ' + clientDoc.workspaceId)
      helpers.successResponse(res, clientDoc);
    })
  });
}
exports.createWorkspace = createWorkspace;