var https             = require('https')
    WorkspaceDocument = require('../models/mongodb/WorkspaceDocument').model
  , UserDocument      = require('../models/mongodb/UserDocument').model
  , async             = require('async')
  , helpers           = require('../libs/Helpers.js')

  ;

function createUser(fn) {
  console.log('User.js createUser')

  var randomUser = 'anon_' + helpers.generateRandomString(22, true);
  var u = new UserDocument({
      authToken: UserDocument.generateAuthToken()
    , plan: {
        type: 'Anonymous'
      }
    , fullName: 'Anonymous User'
    , userName: randomUser
    , email: randomUser
  });

  u.save(function(err) {
    if (err) {
      console.log('createUser save failed - ' + JSON.stringify(err))
      return fn(err);
    }

    fn(null, u);
  }); 
}
exports.createUser = createUser;

function load(userId, fn) {
  UserDocument.load(userId, fn);
}
exports.load = load;

function updateUser(userId, email, userName, password, fn) {
  UserDocument.load(userId, function(err, u) {
    if( err )
      return fn(err);

    u.email = email;
    u.userName = userName;
    u.password = password;
    u.save(function(err, res) {
      if (err) {
        console.log('updateUser save failed - ', err)
        return fn(err);
      }

      fn();
    });
  });
}
exports.updateUser = updateUser;

function fbSignup(userId, fbInfo, fbAccessToken, fn) {
  console.log('FB SIGNUP');
  UserDocument.load(userId, function(err, u) {
    if( err ) {
      console.log('fbsignup recevied error from load' + err)
      return fn(err);
    }

    verifyFBAccessToken(fbInfo.id, fbAccessToken, function(err, verifiedFBInfo) {
      
      if( err ) {
        console.log('fbsignup recevied error from verifyFBAccessToken' + err)
        return fn(err);
      }
        
      if( u.plan.type != 'Anonymous' )
        return fn( new Error('Not an anonymous user - cannot change to free!'));       

      console.log('FB SIGNUP VERIFIED');

      u.email = verifiedFBInfo.email;
      u.userName = verifiedFBInfo.username;
      u.fullName =  verifiedFBInfo.name;
      u.changePlan('Free');

      u.fb.id = fbInfo.id;
      u.fb.accessToken = fbAccessToken;
      u.fb.first_name = fbInfo.first_name;
      u.fb.last_name = fbInfo.last_name;
      u.fb.name = fbInfo.name;
      u.fb.gender = fbInfo.gender;
      u.fb.timezone = fbInfo.timezone;
      u.fb.username = fbInfo.username;        

      u.fb.raw_info = fbInfo;

      u.save(function(err) {

        if (err)
          return fn(err);

        console.log('fbsignup complete! - ' + u._id + ' - ' + u.authToken)
        fn(null, {id: u._id, authToken: u.authToken});
      });

    });
  });
}
exports.fbSignup = fbSignup;

function signup( userId, email, userName, fullName, password, fn ) {
  UserDocument.load(userId, function(err, u) {

    if( err )
      return fn(err);

    if( u.plan.type != 'Anonymous' )
      return fn( new Error('Not an anonymous user - cannot change to free!'));

    u.setPassword(password, function(err, res) {

      if (err)
        return fn(err);

      u.email = email;
      u.userName = userName;
      u.fullName =  fullName;
      u.changePlan('Free');

      u.save(function(err) {

        if (err)
          return fn(err);

        fn(null, {id: u._id, authToken: u.authToken});
      });
    });
  });
}
exports.signup = signup;

function verifyAuthToken(userId, authToken, fn){
  UserDocument.load(userId, function(err, u) {
    if (err) 
      return fn(err);
    
    return fn( null, u.authToken == authToken && u.state != 'Deleted' );
  });
}
exports.verifyAuthToken = verifyAuthToken;

function verifyFBAccessToken(fbId, fbAccessToken, fn) {
  console.log('verifying fb access token ' + fbAccessToken)
  var pageData = '';
  https.get({host:'graph.facebook.com', path:'/me?access_token=' + fbAccessToken}, function (res) {
    res.on('data', function (chunk) {
      pageData += chunk;
    });

    res.on('end', function() {
      pageData = JSON.parse(pageData);
      console.log('verifyFBAccessTpoken got response from FB')
      console.log(pageData);
      if(pageData.error) {
        console.log('it was an error')
        return fn(pageData);
      }
      else{
        console.log('no error')
        fn(null, pageData);
      }
        
    });
    res.on('error', function(data) {
      console.log('error in verify access token');
      console.log(data);
      fn(data);
    })
  });
}
exports.verifyFBAccessToken = verifyFBAccessToken;

function fbLoginSignup(userId, fbInfo, fbAccessToken, fn) {
  // determine whether we should LOG IN or SIGN UP.
  UserDocument.loadByFBId(fbInfo.id, function(err, uDoc) {
    if(err) {
      fbSignup(userId, fbInfo, fbAccessToken, fn);
    }
    else {
      fbLogin(userId, fbInfo, fbAccessToken, uDoc, fn);
    }
  });
}
exports.fbLoginSignup = fbLoginSignup;

function fbLogin(anonymousUserId, fbInfo, fbAccessToken, loginUser, fn) {
  console.log('fblogin');
  async.waterfall( [
      function(cb) {
        console.log('loaded fb user: ' + fbInfo.id)
        verifyFBAccessToken(fbInfo.id, fbAccessToken, function(err, verifiedInfo) {
          if( err || !verifiedInfo )
            return cb( new Error("Bad auth") )

          fbInfo = verifiedInfo;

          cb(null);
        });
      },
      function(cb) {
        console.log('verified access token for user: ' + fbInfo.id);
        UserDocument.load(anonymousUserId, cb);
      },
      function(anonUser, cb) {
        console.log("LOGIN MERGE")
        _mergeUsers(anonUser, loginUser, cb);
      },
      function(cb) {
        console.log("PERSISTING AUTH TOKEN!")
        var token = UserDocument.generateAuthToken();
        loginUser.authToken = token;
        loginUser.fb.id = fbInfo.id;
        loginUser.fb.accessToken = fbAccessToken;
        loginUser.fb.first_name = fbInfo.first_name;
        loginUser.fb.last_name = fbInfo.last_name;
        loginUser.fb.name = fbInfo.name;
        loginUser.fb.gender = fbInfo.gender;
        loginUser.fb.timezone = fbInfo.timezone;
        loginUser.fb.username = fbInfo.username;

        loginUser.save( function(err) {
          cb(err, token);
        });
      }
    ],
    function(err, token) {
      if( err ){
        console.log("ERROR IN LOGIN: " + err + ' ' + JSON.stringify(err));
        return fn(err);
      }

      console.log("LOGIN SUCCEEDED: " + JSON.stringify({id: loginUser._id, authToken: token}))
      fn(null, {id: loginUser._id, authToken: token});
    });
}
exports.fbLogin = fbLogin;


function login(anonymousUserId, email, userName, password, fn) {
  async.waterfall( [

      function(cb) {
        console.log("LOGIN LODAING ", email, userName)
        UserDocument.loadByEmailOrUserName(email, userName, cb);
      },
      function(loginUser, cb) {
        loginUser.verifyPassword(password, function(err, match) {
          if( !match )
            return cb( new Error("Bad auth") )

          cb(null, loginUser);
        });
      },
      function(loginUser, cb) {
        UserDocument.load(anonymousUserId, function(err, u) {
          cb( err, u, loginUser );
        });
      },
      function(anonUser, loginUser, cb) {
        console.log("LOGIN MERGE")
        _mergeUsers(anonUser, loginUser, function(err, res) {
          cb( err, loginUser );
        });
      },
      function(loginUser, cb) {
        console.log("PERSISTING AUTH TOKEN!")
        var token = UserDocument.generateAuthToken();
        loginUser.authToken = token;
        loginUser.save( function(err) {
          cb(err, loginUser, token);
        });
      }
    ],
    function(err, loginUser, token) {
      if( err ){
        console.log("ERROR IN LOGIN: " + err + ' ' + JSON.stringify(err));
        return fn(err);
      }

      console.log("LOGIN SUCCEEDED: " + JSON.stringify({id: loginUser._id, authToken: token}))
      fn(null, {id: loginUser._id, authToken: token});
    });
}
exports.login = login;

function _mergeUsers(oldUser, newUser, callback) {
  // 1. take all workspaces from anonuser and push them into this.
  //    edge case: anon has joined a ws owned by this. (do not push this)
  //    edge case: anon has one workspace which is empty.  (do nothing)
  // 2. ask WorkspaceDocument to propagate merge changes.
  //    it will update the WS owner and shareduser lists.
  //    AT THIS POINT, WE CAN CALLBACK
  // 3. ask FileDocument to propagate userinfo changes.
  //    it will update the uploadedBy fields.
  // 4. mark the anonuserDoc as merged-with this.

  console.log('MERGE!');

  async.waterfall([
    function(callback) {
      // first thing: can we completely ignore doing the merge?
      // we can if the anonymous user has nothing worth merging:
      //  a single owned workspace with no files, and no shared workspaces
      if(anonUser.ownedWorkspaces.length == 1 && anonUser.sharedWorkspaces.length == 0) {
        var ws = WorkspaceDocument.load(anonUser.ownedWorkspaces[0], function(err, wsDoc) {
          if(err) {
            // oh noes.
            return callback(err)
          }

          if(wsDoc.isEmpty()) {
            // nothing to do here.  no need to merge.
            wsDoc.state = 'Deleted';
            wsDoc.save();
            anonUser.state = 'Deleted';
            anonUser.save();

            console.log('Nothing to merge, empty anon user!')
            return fn();
          } else {
            // the workspace isn't empty - have to merge.
            callback();
          }
        });
      }
      else {
        // ok, we have to merge.
        callback();
      }
    },
    // TODO: these could be parallel
    function(callback) {
      _mergeUserDocuments(anonUser, loginUser, callback);
    },
    function(callback){
      // tell the workspacedoc to do its work.
      _mergeWorkspaceDocuments(anonUser, loginUser, callback);
    },
    function(callback){
      // anonUser is toast.  loginUser owns all files.
      _mergeFileDocuments(anonUser, loginUser, callback)
    },
    function(callback){
      UserDocument.destroyUser(anonUser._id, callback);
    }]
  , function(err) {
    console.log("DONE MERGE")
    fn(err);
  });
}

function _mergeUserDocuments(oldUser, newUser, callback) {
  console.log('MERGING USERS!')

  // merge anon's userdoc with this.
  // first, ownedWorkspaces - easy, we become owner.
  for(var i = 0; i < anonUser.ownedWorkspaces.length; i++) {
    // then we should remove newUser from the shared list of that workspace doc.
    newUser.ownedWorkspaces.push(anonUser.ownedWorkspaces[i]);
    
    var locationInShared = _.find(newUser.sharedWorkspaces, function(ws) { return ws == anonUser.ownedWorkspaces[i]; } ) ;
    if(locationInShared >= 0)
      newUser.sharedWorkspaces.splice(locationInShared, 1);
  }

  // now, give newUser access to anon's shared workspaces.
  for(var j = 0; j < anonUser.sharedWorkspaces.length; j++) {
    // if it already exists in newUser, there's no need to add it.
    var sharedMatch = _.find(newUser.sharedWorkspaces, function(ws) { return ws == anonUser.sharedWorkspaces[j]; } );
    var ownedMatch = _.find(newUser.ownedWorkspaces, function(ws) { return ws == anonUser.sharedWorkspaces[j]; } );

    if (!sharedMatch && !ownedMatch)
      newUser.sharedWorkspaces.push(anonUser.sharedWorkspaces[j]);
  }

  // clear up anonuser
  anonUser.ownedWorkspaces = [];
  anonUser.sharedWorkspaces = [];

  // cool, save the change.
  newUser.save(function(err) {
    console.log('saved user doc: ' + newUser._id);

    callback(err)
    anonUser.save();
  });
}

function _mergeWorkspaceDocuments(oldUser, newUser, callback) {
  async.parallel([
    function(parallelcb){

      // find all workspaces owned by anonuser, and change ownership to newuser.
      WorkspaceDocument.find( { 'owner' : anonUser._id }, function(err, docs) {
        if(err)
          return parallelcb(err);

        console.log('found ' + docs.length + ' matching owner = ' + anonUser._id);
        async.forEach(docs, function(doc, foreachcb) {
          // remove newUser from shared list. - newUser is OWNER now.

          console.log('MERGE changing owner for workspace:  ' + doc.workspaceId)
          doc.removeUser(newUser);
          doc.owner = newUser._id;
          
          doc.save(foreachcb);

        }, parallelcb);
      });
    },
    function(parallelcb) {
      WorkspaceDocument.find( { 'sharedUsers' : anonUser._id }, function(err, docs) {
        if(err)
          return parallelcb(err);

        console.log('found ' + docs.length + ' matching sharedUsers = ' + anonUser._id);
        async.forEach(docs, function(doc, foreachcb) {
          // anonUser is no longer part of this workspace.
          console.log('MERGE merging shared for workspace:  ' + doc.workspaceId)
          doc.removeUser(anonUser);
          doc.addUser(newUser);
          
          doc.save(foreachcb);

        }, parallelcb);

      });
    }],
  function(err) {
    fn(err);
  });
}

function _mergeFileDocuments(oldUser, newUser, callback) {
  FileDocument.update(
    { uploadedBy: oldUser._id }, 
    { $set: { uploadedBy: newUser._id } }, 
    { multi: true }, 
    function(err) {
      callback(err);
    })   
}

function logout(userId, fn) {
  async.waterfall( [

      function(cb) {
        UserDocument.load(userId, cb);
      },
      function(loginUser, cb) {
        delete loginUser.authToken;
        loginUser.save(cb);
      }
    ],
    fn);        
}
exports.logout = logout;