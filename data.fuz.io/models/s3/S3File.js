
// Here's the bug we're working around with this: https://github.com/awssum/awssum/issues/164
// File transfers to S3 were failing because of node's stronger TLS security check.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

var awssum            = require('awssum-amazon-s3')
  , _                 = require('underscore')
  , stream            = require('stream')
  , EventEmitter      = require('events').EventEmitter
  , util              = require('util')
  , privateConfig     = require('../../Config_Private.js')
  , config            = require('../../Config.js')
  , BUFFER_SIZE       = 100000
  ;

var s3 = new awssum.S3({
    accessKeyId: privateConfig.accessKeyId
  , secretAccessKey: privateConfig.secretAccessKey
  , awsAccountId: privateConfig.accountId
  , region: awssum.US_EAST_1
})

function deleteFile(bucket, path, fn) {
  var options = {
    BucketName : bucket,
    ObjectName : path
  };
  console.log('delete s3 file called: ' + bucket + ' ' + path)
  s3.DeleteObject(options, function(err, data) { 
    if(err)
      console.log("DELETOBJ ERR: " + JSON.stringify(err))
    if(data)
      console.log("DELETOBJ DATA: " + JSON.stringify(data))

    fn(err);
  });
}

function S3PutStream(bucket, path, fileName, contentLength, expiryMS, contentType, buffering) {
  stream.PassThrough.call(this);
  var self            = this
    ;

  this.buffering = buffering;
  this.bufferedChunks = [];
  this.retries = 0;
  this.completed = false;

  this.options = {
    BucketName    : bucket,
    ObjectName    : [path,fileName].join('/'),
    ContentLength : contentLength,
    Body          : this,
    Acl           : 'public-read',
    ContentType   : contentType
  };

  _.bindAll(this, '_write', 'end')

  if( expiryMS && expiryMS > 0 )
    this.options.Expires = expiryMS;

  this._beginUpload();
}
util.inherits(S3PutStream, stream.PassThrough);

S3PutStream.prototype._write = function(chunk, encoding, callback) {
  if(this.buffering)
    this.bufferedChunks.push(chunk);
  stream.PassThrough.prototype._write.apply(this, arguments);
}

S3PutStream.prototype.end = function() {
  var self = this;

  this.once('finish', function() {
    if(self.buffering) {
      self.retryBuffer = new Buffer(self.bufferedChunks.join(''));
      delete self.bufferedChunks; 
    }
  })
  
  stream.PassThrough.prototype.end.apply(this, arguments);
};
S3PutStream.prototype._beginUpload = function() {
  var self = this;
  s3.PutObject(this.options, function(err, data) {
    if(err) {
      if(self.buffering && self.retries < 3) {
        console.log('s3.putobject failed (retrying) - ' + self.options.ObjectName + ' - ' + JSON.stringify(err))
        self._retryUpload();
      }
      else {
        console.log('s3.putobject failed - ' + self.options.ObjectName + ' - ' + JSON.stringify(err))
        self.emit('error')
      }
    }
    else {
      self.hash = data.Headers.etag.replace(/\"/g, '');
      self.completed = true;
      self.emit('uploadcomplete', self.hash);
      delete self.retryBuffer;
    }
  });  
}

S3PutStream.prototype._retryUpload = function() {
  if(!this.buffering)
    throw new Error('CANNOT RETRY A NON-BUFFERED STREAM')

  if(!this.retryBuffer) {
    console.log('RETRY called with no retry buffer... waiting for end signal')
    this.on('finish', this._retryUpload);
  } else {
    console.log('RETRYING', this.retries, this.options.ObjectName)
    this.retries++;
    this.options.Body = this.retryBuffer;
    this._beginUpload();
  }
}

exports.S3PutStream = S3PutStream;
exports.deleteFile = deleteFile;
