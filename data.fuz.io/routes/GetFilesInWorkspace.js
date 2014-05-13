var _                 = require('underscore')
  , async             = require('async')
  , workspace         = require('../controllers/Workspace.js')
  , helpers           = require('../libs/Helpers.js')
  ;

function getFilesInWorkspace(req, res, next) {
  console.log('getFilesInWorkspace: ' + req.params.wsId, req.query);

  var options = {};
  options.limit = req.query.limit || 10;
  options.page = req.query.page;

  workspace.listFiles(req.params.wsId, options, function(err, files) {

    if(err) {
      err.where = 'getFilesInWorkspace workspace.listFiles';
      helpers.errorResponse(res, 400, err);
      return;
    }

    async.map(files, function(f, callback) {
      f.mapToClientDocument(callback);
    }, function(err, results) {
      if( err ) {
        err.where('getFIlesInWorkspace workspace.listFiles f.mapToClientDocument')
        helpers.errorResponse(res, 400, err)
        return;
      }      

      helpers.successResponse(res, results);
    })
  });
}

exports.getFilesInWorkspace = getFilesInWorkspace;
