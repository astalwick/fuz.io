var helpers         = require('../libs/Helpers.js')
  , siteconfig      = require('../Config.js')

function redirNonApi(req, res, next) {
  console.log("You're in the wrong place - redirecting to "  + siteconfig.url);
  res.writeHead(302, {'Location': siteconfig.url});
  res.end();
}

exports.redirNonApi = redirNonApi;    