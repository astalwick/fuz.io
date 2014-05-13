var helpers         = require('../libs/Helpers.js')

function options(req, res, next) {
  helpers.successResponse(res, {})
}

exports.options = options;