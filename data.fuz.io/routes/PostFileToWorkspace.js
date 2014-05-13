var formidable      = require('formidable')
  , workspace       = require('../controllers/Workspace.js')
  , helpers         = require('../libs/Helpers.js')

function postFileToWorkspace(req, res, next) {
  console.log('postFileToWorkspace: ' + req.params.wsId);

  var form =  new formidable.IncomingForm();

  workspace.uploadFile(req.params.wsId, form, function(err, uploadResult) {
    if( err ) {
      console.log("File upload failed: " + JSON.stringify(err));
      if(!res.headersSent) {
        res.header('Connection', 'close'); 
        res.send(413, 'Upload Failed'); 
      }
      return;
    }

    console.log("all files uploaded");
    helpers.successResponse(res, {})
  });

  form.parse(req, function(err) {
    if(err)
      console.log('form parse err', err);
  });
}

exports.postFileToWorkspace = postFileToWorkspace;
