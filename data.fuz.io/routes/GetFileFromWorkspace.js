var workspace       = require('../controllers/Workspace.js')
  , helpers         = require('../libs/Helpers.js')
  , siteconfig      = require('../Config.js')

function getFileFromWorkspace(req, res, next) {
  console.log('getFileFromWorkspace: ' + req.params.wsId + ' - ' + req.params.fileId + ' - ' + req.params.fileName);
  
  workspace.getFile(req.params.wsId, req.params.fileId, function(err, fileDownloader, fileName, contentLength, expectedMD5) {
    if( err ) {
      err.where('getFileFromWorkspace workspace.getFile');
      helpers.errorResponse(res, 400, err);
      return;
    }

    res.writeHead(200, {'eTag' : expectedMD5, 'Content-Length': contentLength, 'Content-Type': 'binary/octet-stream', 'Content-Disposition' : 'attachment; req.params.fileName='+ req.params.fileName, 'Access-Control-Allow-Origin': siteconfig.url, 'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS' });
    fileDownloader.pipe(res);
  });
}

exports.getFileFromWorkspace = getFileFromWorkspace;