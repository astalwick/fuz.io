var mongoose            = require('mongoose')
  , bcrypt              = require('bcrypt')
  , uuid                = require('node-uuid')
  , async               = require('async')
  , _                   = require('underscore')
  , lastMod             = require('./Plugin_LastMod.js')       
  , broadcast           = require('./Plugin_Broadcast.js')  
  , WorkspaceDocument   = require('./WorkspaceDocument.js').model
  , Schema              = mongoose.Schema  
  ;

var schema = new Schema({
  email                 :   { type: String, index: { unique: true } }, 
  userName              :   { type: String, index: { unique: true } },
  fullName              :   { type: String },
  passwordHash          :   { type: String },
  
  ownedWorkspaces       :   [ { type: Schema.ObjectId } ],
  sharedWorkspaces      :   [ { type: Schema.ObjectId } ],
  storageUsed           :   { type: Number, min: 0 },
  plan                  :   {
                              type              : { type: String, required: true }
                            },  

  authToken             :   { type: String },
  state                 :   { type: String, enum: ['Active', 'Deleted'], required: true, default: 'Active' },
  fb                    :   {
                              id                : { type: Number },
                              accessToken       : { type: String },
                              first_name        : { type: String },
                              last_name         : { type: String },
                              name              : { type: String },
                              gender            : { type: String },
                              timezone          : { type: Number },
                              username          : { type: String }
                            }
});

schema.plugin(lastMod);
schema.plugin(broadcast, {name: 'User'});

schema.methods = {
  
  changePlan: function(newPlanType){
    this.plan.type = newPlanType;
  },
  mapToClientDocument: function(callback) {
    if(!callback)
      throw new Error('no callback in userdoc mapToClientDocument')

    var that            = this.toObject();

    var clientDoc = {
        _id                 : that._id,
        email               : that.email,
        fullName            : that.fullName,
        userName            : that.userName,
        ownedWorkspaces     : that.ownedWorkspaces,
        sharedWorkspaces    : that.sharedWorkspaces,
        storageUsed         : that.storageUsed,
        lastMod             : that.lastMod,
        plan                : { type : that.plan.type }
      };


    async.parallel({
      shared: function(callback) {
        async.map(that.sharedWorkspaces, function(id, callback) {
          WorkspaceDocument.findOne({_id: id}, {title: 1, workspaceId: 1}, callback)
        }, callback)
      }
    , owned: function(callback) {
        async.map(that.ownedWorkspaces, function(id, callback) {
          WorkspaceDocument.findOne({_id: id}, {title: 1, workspaceId: 1}, callback)
        }, callback)
      }
    }, function(err, results) {

      clientDoc.ownedWorkspaces = results.owned;
      clientDoc.sharedWorkspaces =  results.shared;
      callback(null, clientDoc);  
    });
    
  },
  saveAsNew: function(callback) {
    if (this._id) {
      return callback( new Error("_id already defined - cannot saveAsNew") );
    }
    this.save(callback);
  },
  isWorkspaceAdded: function( workspaceId ) {
    return  _.find( this.sharedWorkspaces, function(wsId) { return wsId == workspaceId; }) || 
            _.find( this.ownedWorkspaces , function(wsId) { return wsId == workspaceId; });
  },
  addWorkspace: function(workspace, owner) {

    console.log('Adding workspace: ' + workspace.workspaceId + ' to user ' + this._id )
    if( this.isWorkspaceAdded(workspace.workspaceId) ) {
      return;
    }

    if (owner) {
      console.log('addWorkspace - owner - ' + workspace.workspaceId);
      this.ownedWorkspaces.push(workspace._id);
    }
    else {
      console.log('addWorkspace - shared - ' + workspace.workspaceId);
      this.sharedWorkspaces.push(workspace._id);
    }
  },
  removeWorkspace: function(workspace) {
    console.log('removeWorkspace called for id ' + workspace.workspaceId);
    var item = _.find( this.sharedWorkspaces, function(ws) { return ws == workspace.workspaceId; });
    if(item) {
      console.log('removing workspace from shared');
      item.remove();
    }
    
    item = _.find( this.ownedWorkspaces, function(ws) { return ws == workspace.workspaceId; });
    if(item) {
      console.log('removing workspace from owned');
      item.remove();
    }
      
  },
  setPassword: function(password, cb) {
    if(!password || password.length == 0)
      return cb(new Error('Invalid password'))
    var that = this;
    async.waterfall(
        [
          function(callback) { 
            bcrypt.genSalt(10, callback); 
          }, 
          function(salt, callback) {
            bcrypt.hash(password, salt, callback);
          },
          function(hash, callback) {
            that.passwordHash = hash;
            callback(null);
          }
        ]
      , cb
    );
  },
  verifyPassword: function(password, cb) {
    if (this.passwordHash) {
      bcrypt.compare(password, this.passwordHash, cb);
    } else {
      cb(null, false);
    }
  },
};

schema.statics = {
  destroyUser: function(userId, fn) {

    // TODO we should also destroy workspaces owned by the user,
    // ensure that any users subscribed to those workspaces are unsubscribed,
    // destroy files owned by the user,
    // etc.  user should not exist in db - anywhere.

    UserDocument.remove({_id: userId}, fn);
  }
, generateAuthToken: function() {
    var buffer = new Array(16);
    uuid.v4(null, buffer, 0);
    return uuid.unparse(buffer);
  }

, load: function(userId, callback) {
    var self = this;
    UserDocument.findOne({_id: userId}, function(err, doc) {
      if (err) 
        return callback(err);

      if(!doc)
        return callback( new Error("UserId: " + userId + " not found"))
      
      self.model = doc;
      callback(null, self.model);
    });
  }
, loadByFBId : function(fbId, callback) {
    var self = this;
    console.log('loadbyfbid: ' + fbId)
    UserDocument.findOne({"fb.id": fbId}, function(err, doc) {
      if (err) 
        return callback(err);

      if(!doc)
        return callback( new Error("Facebook ID: " + fbId + " not found"))
      
      self.model = doc;
      callback(null, self.model);
    });
  }
, loadByEmailOrUserName : function(email, userName, callback) {
    var self = this;
    UserDocument.findOne({ $or: [ {email:email}, {userName: userName}]}, function(err, doc) {
      if (err) 
        return callback(err);

      if(!doc)
        return callback( new Error("user " + userName + " (" + email + ") not found"))
      
      self.model = doc;
      callback(null, self.model);
    });

  }
}

var UserDocument = mongoose.model('UserDocument', schema);
/*****************************************************************************/
exports.model   = UserDocument;
exports.schema  = schema;