var workspace       = require('../controllers/Workspace')
  , helpers         = require('../libs/Helpers.js')
  ;

function addUserToWorkspace(req, res, next) {
  console.log('adduser called')
  workspace.addUser(req.params.wsId, req.body.userid, function(err, result) {
    // we'll silently  absorb the adduser requrest if it has already been done.
    if (err && (!err.error || err.error != 'UserAlreadyAdded')) {
      err.where = 'addUserToWorkspace workspace.addUser'
      helpers.errorResponse(res, 400, err);
      return;
    };

    helpers.successResponse(res, {});
  });
}

exports.addUserToWorkspace = addUserToWorkspace;