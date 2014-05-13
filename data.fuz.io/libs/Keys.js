var Keygrip = require('keygrip')
  , Config  = require('../Config_Private.js')
  ;

module.exports = new Keygrip([Config.cookieSecret]);