var mongoose            = require('mongoose')
  , async               = require('async')
  , lastMod             = require('./Plugin_LastMod.js')
  , broadcast           = require('./Plugin_Broadcast.js')  
  , Schema              = mongoose.Schema  
  , ObjectId            = mongoose.Types.ObjectId
  ;

var schema = new Schema({
  workspaceId     :   { type: String },
  uploadedBlocks  :   { type: Number, min: 0 },
  uploadedBytes   :   { type: Number, min: 0 },
  blockSize       :   { type: Number, min: 0 },
  totalBlocks     :   { type: Number, min: 0 },
  state           :   { type: String, enum: ['Uploading', 'Cancelled', 'Errored', 'Deleted', 'Completed'], required: true },
  deleted         :   { type: Boolean },
  uploadedBy      :   { type: Schema.ObjectId },
  fileName        :   { type: String },
  mimeType        :   { type: String },
  size            :   { type: Number, min: 0 },
  uploadTime      :   { type: Date },
  md5             :   { type: String }

});

schema.plugin(lastMod);
schema.plugin(broadcast, {name: 'File'});

schema.methods = {

  mapToClientDocument: function(callback) {
    var that            = this.toObject();

    var date = that.lastMod;
    var diff = new Date() - date;

    // TODO: refactor this.
    // we're doing this check in maptoclient.  Isn't there somewhere better?
    if(that.state == 'Uploading' && diff / 1000 > 30) {
      console.log("DETECTED CANCELLED UPLOAD (diff: " + diff + ")  - MARKING AS ERRORED")
      this.state = 'Errored';
      this.save();
    }
    else if(( that.state == 'Deleted' || that.state == 'Errored' || that.state == 'Cancelled' ) && diff / 1000 > 120) {
      // a file stays in a 'deleted' state for 120sec.

      // mark it as permanently deleted. (this hides the file from the user)
      this.deleted = true;
      this.save();
    }

    var clientDoc = {
        _id             : that._id,
        workspaceId     : that.workspaceId,
        state           : that.state,
        owner           : that.owner,
        uploadedBytes   : that.uploadedBytes,
        fileName        : that.fileName,
        mimeType        : that.mimeType,
        lastMod         : that.lastMod,         
        size            : that.size,
        uploadTime      : that.uploadTime
    };

    UserDocument.findOne({_id: that.uploadedBy}, {username: 1, fullName: 1}, function(err, userDoc) {
      if(err)
        return callback(err);
      
      clientDoc.uploadedBy = userDoc;
      callback(null, clientDoc);

    })
  }
};

schema.statics = {
  load: function(id, callback) {
    FileDocument.findOne({_id: id}, function(err, doc) {
      if(!doc)
        return callback( new Error("file id: " + id + " not found"))
      
      callback(null, doc);
    });
  }  
}
var FileDocument = mongoose.model('FileDocument', schema);



/*****************************************************************************/
exports.model   = FileDocument;
exports.schema  = schema;