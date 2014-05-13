// deleteuser
var user        = require('../models/user.js')
  , helpers     = require('../libs/Helpers.js')

function deleteUser(req, res, next) {
  console.log("NOT IMPLMENETED")
  console.log('deleteUser: ' + uid);

  helpers.errorResponse(res, 400, new Error('NOT IMPLEMENTED'))
}

exports.deleteUser = deleteUser;