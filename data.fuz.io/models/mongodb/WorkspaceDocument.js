var mongoose            = require('mongoose')
  , async               = require('async')
  , _                   = require('underscore')
  , lastMod             = require('./Plugin_LastMod.js')
  , broadcast           = require('./Plugin_Broadcast.js')      
  , helpers             = require('../../libs/Helpers.js')
  , Schema              = mongoose.Schema  
  , ObjectId            = mongoose.Types.ObjectId
  ;

var schema = new Schema({
  workspaceId       :   { type: String, index: { unique: true }, required: true},
  title             :   { type: String }, 
  size              :   { type: Number, min: 0 },
  owner             :   { type: Schema.ObjectId, required: true },
  sharedUsers       :   [ { type: Schema.ObjectId } ],
  files             :   [ { type: Schema.ObjectId } ],
  state             :   { type: String, enum: ['Active', 'Deleted'], required: true, default: 'Active' }
});

schema.plugin(lastMod);
schema.plugin(broadcast, {name: 'Workspace', key: 'workspaceId'});

schema.methods = {
    isEmpty: function() {
      return this.size == 0 && this.files.length == 0 && this.sharedUsers.length == 0;
    },

    mapToClientDocument: function(callback) {
      var that            = this.toObject();

      var clientDoc = {
        id                     : that.workspaceId,
        workspaceId            : that.workspaceId,
        title                  : that.title,
        owner                  : that.owner,
        files                  : that.files,
        fileCount              : that.files.length,
        sharedUsers            : that.sharedUsers
      };
     
      callback(null, clientDoc)
    },

    saveAsNew: function(callback) {
      var self = this;
      var id = helpers.generateRandomString(5);
      WorkspaceDocument.find( { workspaceId : id }, function(err, docs) {
        if( err )
          return callback(err);

        if( docs.length > 0 ) {
          console.log("generated id that already exists! retry!")
          return saveAsNew( callback );
        }
        self.workspaceId = id;
        console.log('saveAsNew saving')
        self.save(callback);
      });
    },  
    isUserAdded: function(userId) {
      return this.owner == userId || _.find( this.sharedUsers, function(u) { return userId == u; });
    },
    addUser: function(user) {
      if( this.isUserAdded(user._id) ) 
        return;
      
      this.sharedUsers.push(user._id);
    },
    removeUser: function(user) {
      this.sharedUsers = _.filter( this.sharedUsers, function(u) { return user._id != u; } );
    },
    
    
};

schema.statics = {
  load: function(workspaceId, callback) {
      var self = this;
      WorkspaceDocument.findOne({workspaceId: workspaceId}, function(err, doc) {
        if(!doc)
          return callback( new Error("Workspace id: " + workspaceId + " not found"))
        
        self.model = doc;
        callback(null, self.model);
      });
    }
, destroy: function(callback) {
      // TODO: destroy the workspace.  remove the document from mongodb.
    }    
}

var WorkspaceDocument = mongoose.model('WorkspaceDocument', schema);

/*****************************************************************************/
exports.model   = WorkspaceDocument;
exports.schema  = schema;