exports.deleteWorkspace           = require('./DeleteWorkspace.js').deleteWorkspace;
exports.updateWorkspace           = require('./UpdateWorkspace.js').updateWorkspace;
exports.createWorkspace           = require('./CreateWorkspace.js').createWorkspace;

exports.getFileFromWorkspace      = require('./GetFileFromWorkspace.js').getFileFromWorkspace;
exports.deleteFileFromWorkspace   = require('./DeleteFileFromWorkspace.js').deleteFileFromWorkspace;

exports.getFilesInWorkspace       = require('./GetFilesInWorkspace.js').getFilesInWorkspace;
exports.postFileToWorkspace       = require('./PostFileToWorkspace.js').postFileToWorkspace;
exports.addUserToWorkspace        = require('./AddUserToWorkspace.js').addUserToWorkspace;
exports.removeUserFromWorkspace   = require('./RemoveUserFromWorkspace.js').removeUserFromWorkspace;
exports.getWorkspace              = require('./GetWorkspace.js').getWorkspace;
exports.getUsersInWorkspace       = require('./GetUsersInWorkspace.js').getUsersInWorkspace;

exports.createUser                = require('./CreateUser.js').createUser;
exports.getUser                   = require('./GetUser.js').getUser;
exports.getMe                     = require('./GetMe.js').getMe;
exports.updateUser                = require('./UpdateUser.js').updateUser;
exports.signUp                    = require('./Signup.js').signUp;

exports.login                     = require('./Login.js').login;
exports.fbLoginSignup             = require('./Login.js').fbLoginSignup;
exports.logout                    = require('./Logout.js').logout;

exports.options                   = require('./Options.js').options;
exports.fourOhFour                = require('./FourOhFour.js').fourOhFour;
exports.redirNonApi               = require('./RedirNonApi.js').redirNonApi;
exports.favIcon                   = require('./FavIcon.js').favIcon;