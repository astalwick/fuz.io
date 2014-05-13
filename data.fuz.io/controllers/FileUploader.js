var stream              = require('stream')
  , _                   = require('underscore')
  , StreamBrk           = require('streambrk')
  , util                = require('util')

  , s3PutStream         = require('../models/s3/S3File.js').S3PutStream
  , config              = require('../Config.js')
  , MAX_PENDING_PARTS   = config.maxPendingUploadParts
  , PART_EXPIRY_HOURS   = config.partExpiryHours
  ;

function FileUploader(options) {

  // There is no reason to buffer in this stream.
  // It's job is simply to reflect the two streams it writes to.  If either are busy,
  // it is busy.
  options.highWaterMark = 1;

  this.options = options;

  // Initialize our CompleteFileStream
  // This will upload our stream to a single large file.
  this.completeStream = new s3PutStream(
      'content.fuz.io'
    , options.workspaceId
    , options.fileName
    , options.fileSize
    , 0
    , options.mimeType
    , false);

  var self = this;
  this.completeStream.on('uploadcomplete', function(hash) {
    console.log('COMPLETE STREAM HASH:', hash)
    self._uploadComplete();
  })

  this.completeStream.on('uploaderror', function() {
    // todo - this must FALL BACK to the part stream (if the upload completes)
    // and use the partstream to rebuild the completestream.

    // basically: on 'uploadcomplete' of part stream, we use streamfuz
    // to pull together the parts and pipe them back in to s3 as a 
    // new completestream.

    // if partstream fails, we've failed.
  })

  // Initialize our PartFileStream
  // This stream will auto-break our upload into parts of size options.blockSize
  this.partStream = new StreamBrk({
    newPartFn: _.bind(this.newPart, this)  // TODO: this is weird.  'this' for newpart should be the partstream, not fileuploader.
  , partSize: options.blockSize
  })

  // Part management.  
  // One role of the FileUploader is to manage the part transfer and 
  // ensure that new parts are handed on respecting our desired parallelism.
  this.currentPart = 0;
  this.pendingPartsCallbacks = [];
  this.maxInFlightParts = MAX_PENDING_PARTS;
  this.inFlightParts = 0;
  this.errored = false;

  _.bind(this._onFinish, this);
  this.on('finish', this._onFinish)

  stream.Writable.call(this, options);
};

util.inherits(FileUploader, stream.Writable);

FileUploader.prototype.newPart = function(partNumber, callback) {
  // TODO: rewire this so that 'self' and 'this' refer to partstream, not
  // fileuploader.  There's no good reason for us to be accessing FileUploader's
  // this in here.

  var self          = this
    , partNumber    = self.currentPart
    , partContentLength = self.options.fileSize - (self.options.blockSize * self.currentPart)
    ;

  // enforce our parallelism requriement
  if(this.inFlightParts >= this.maxInFlightParts) {
    // we have too many parallel part requests already.
    this.pendingPartsCallbacks.push(arguments);
    return;
  }

  // we have more data remaining that one full part.
  // therefore, this part is going to max out its blocksize.
  if(partContentLength > self.options.blockSize)
    partContentLength = self.options.blockSize;

  console.log('Part STARTING (S3) -- ', partNumber, self.options.fileName + '.part' + partNumber, partContentLength)

  // Initialize our new part stream.
  var nextPart = new s3PutStream(
      'parts.fuz.io'
    , self.options.workspaceId
    , self.options.fileName + '.part' + partNumber
    , partContentLength
    , PART_EXPIRY_HOURS * 60 * 60 * 1000
    , undefined
    , true );

  nextPart.once('uploadcomplete', function() {
    self.inFlightParts--;
    self.emit('partcomplete', partNumber, partContentLength)
    console.log('Part Complete (S3) -- ', partNumber, self.options.fileName + '.part' + partNumber, partContentLength)

    // have we ended?
    if(self._writableState.finished && self.inFlightParts == 0 && self.pendingPartsCallbacks.length == 0) {
      console.log('PART STREAM HASH:', self.partStream.hash)
      self._uploadComplete();
    }
    // should we fetch a new part?
    else if(self.pendingPartsCallbacks.length > 0 && self.inFlightParts < self.maxInFlightParts && !self.errored) {
      self.newPart.apply(self, self.pendingPartsCallbacks.shift());
    }
  })
  nextPart.once('uploaderror', function() {
    console.log('Part ERROR (S3) -- ', partNumber, self.options.fileName + '.part' + partNumber, partContentLength)
    self.errored = true;
    self.emit('error');
  })
  self.currentPart++;
  self.inFlightParts++;
  callback(null, nextPart);
}

FileUploader.prototype.cancelUpload = function() {
  this.cancelled = true;
  this.completeStream.end();
  this.partStream.end();
}

FileUploader.prototype._write = function(chunk, encoding, callback) {
  var self = this;
  this.completeStreamBlocked = false;
  this.partStreamBlocked = false;

  if(this.cancelled)
    return callback();

  // write out to completestream
  if(this.completeStream && !this.completeStream.write(chunk, encoding)) {
    this.completeStreamBlocked = true;
    this.completeStream.once('drain', function() {
      self.completeStreamBlocked = false;
      if(!self.partStreamBlocked)
        callback();
    })
  }

  // write out to partstream
  if(this.partStream && !this.partStream.write(chunk, encoding)) {
    this.partStreamBlocked = true;
    this.partStream.once('drain', function() {
      self.partStreamBlocked = false;
      if(!self.completeStreamBlocked)
        callback();
    })
  }

  if(!this.partStreamBlocked && !this.completeStreamBlocked)
    callback();
}

FileUploader.prototype._onFinish = function() {
  var self = this;

  this.completeStream.end();
  this.partStream.end();

  console.log('FILEUPLOADER FINISH')
};

FileUploader.prototype._uploadComplete = function() {
  if(this.completeStream.completed && this.partStream.completed) {
    console.log('')
    if(this.completeStream.hash == this.partStream.hash) {
      console.log('FILEUPLOADER - Upload complete, notifying out', self.partStream.hash)
      self.emit('uploadcomplete', self.partStream.hash)
    }
    else {
      console.log(('ERROR, hash mismatch - partStream:' + self.partStream.hash + ' - completeStream: ' +self.completeStream.hash).red)
      self.emit('uploaderror', new Error('HASH MISMATCH', self.partStream.hash, self.completeStream.hash));
    }
  }
}

exports.FileUploader = FileUploader;
