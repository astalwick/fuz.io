var helpers         = require('../libs/Helpers.js')

function fourOhFour(req, res, next) {
  helpers.errorResponse(res, 404, new Error('The content you are looking for could not be found'))
}

exports.fourOhFour = fourOhFour;