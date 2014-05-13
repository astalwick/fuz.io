var siteconfig = require('../Config.js');

var lowercasecharset = "abcdefghijklmnopqrstuvwxyz0123456789";
var uppercasecharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRandomString(chars, includeUppercase) {
	var charset = includeUppercase ? uppercasecharset : lowercasecharset;
	var str = '';
	for( var i = 0; i < chars; i++ ) {
		str += charset[Math.floor(Math.random() * charset.length)];
	}
	return str;
}

function jsonHeaders() {
  return { 'content-type'                 : 'application/json'
         , 'Cache-Control'                : 'no-cache'
         , 'Access-Control-Allow-Origin'  : siteconfig.url
         , 'Access-Control-Allow-Headers' : 'X-HTTP-Method-Override, Content-Type'
         , 'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS'
       };
    }

function toUTC(date) {
	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

function UTCNow() {
	return toUTC(new Date());
}

function errorResponse(res, code, errorObject) {
  res.writeHead(code,  jsonHeaders());
  console.log(code + ' - ' + JSON.stringify(errorObject));
  res.write(JSON.stringify(errorObject));
  res.end();
}

function successResponse(res, responseObject) {
  res.writeHead(200,  jsonHeaders());
  res.write(JSON.stringify(responseObject));
  res.end();  
}

exports.jsonHeaders = jsonHeaders;
exports.generateRandomString = generateRandomString;
exports.toUTC = toUTC;
exports.UTCNow = UTCNow;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;