var crypto              = require('crypto')
  , http                = require('http')
  , FileDocument        = require('../models/mongodb/FileDocument.js').model
  , StreamFuz           = require('streamfuz')
  , config              = require('../Config.js')
  , S3DownloadAgent     = new http.Agent()
  , BUFFER_SIZE         = config.downloadBufferSize
  , PARALLEL_REQUESTS   = config.parallelDownloads
  ;

S3DownloadAgent.maxSockets = config.s3DownloadSockets;

function PartFileDownloader(fdoc) {
  this.fileDocument = fdoc;

  this.hash = crypto.createHash('md5');

  this.streamFuz = new StreamFuz( {
    parallel: PARALLEL_REQUESTS, 
    bufferSize: BUFFER_SIZE 
  });
}

PartFileDownloader.prototype.pipe = function(destination) {
  console.log("PARTFILE DOWNLOAD STARTED - " + this.fileDocument.fileName.green)
  var self = this;
  // enqueue up the parts.
  for(var i = 0; i < this.fileDocument.totalBlocks; i++) {
    this.streamFuz.enqueue(this._partRequester(i));
  }

  // pipe our fuzed stream off to the destination.
  this.streamFuz.pipe(destination);


  if(self.fileDocument.md5) {
    // simply double-checks that the file transfer was ok.
    this.streamFuz.on('data', function(d) {
      self.hash.update(d);
    });

    this.streamFuz.on('end', function() {
      var md5 = self.hash.digest('hex');
      var log = 'md5 mismatch - expected ' + self.fileDocument.md5 + ' actual ' + md5;
      if(md5 != self.fileDocument.md5) {
        console.log(log.red);
        console.log(log.red);
        console.log(log.red);
        console.log(log.red);
        console.log(log.red);
      }

      console.log('done - expected ' + self.fileDocument.md5 + ' actual ' + md5);
    });
  }
}

PartFileDownloader.prototype._partRequester = function(part) {
  var self = this;
  return function(callback) {
    self._fetchPart(part, callback);
  }
}

PartFileDownloader.prototype._checkAndFetch = function(part, callback) {
  var self = this;

  // checkAndFetch is called because a fetch failed.  
  // we *check* that our fileDoc has enough uploaded parts for us to fulfill
  // this fetch.  if not, we timeout for awhile and try in a bit.
  // if it does have enough parts, we *fetch* the part by recursively 
  // calling fetchPart.

  FileDocument.findOne({_id : self.fileDocument._id}, {uploadedBlocks : 1, state : 1}, function(err, res)  {
    if(res.state == 'Cancelled' || res.state == 'Deleted' || res.state == 'Errored')
      return callback(new Error('CANCELLED'));

    if(part < res.uploadedBlocks) {
      // so, the file SHOULD be at s3. 
      // we timeout for a short amount of time, and then try again.

      //console.log('(retrying s3 part '+part+' in 100ms) (uploaded blocks: ' + res.uploadedBlocks + ')');
      setTimeout(function() {
        self._fetchPart(part, callback);
      }, 100);

    }
    else {
      // the part we're requesting isn't ready.
      // wait for half a second before testing again.

      //console.log('(waiting to catch up, part '+part+') (uploaded blocks: ' + res.uploadedBlocks + ')');
      setTimeout(function() {
        self._checkAndFetch(part, callback)
      }, 500);
    }
  });        
}

PartFileDownloader.prototype._fetchPart = function(part, callback) {

  var self = this
    , path = self.fileDocument.workspaceId + '/' + encodeURIComponent(self.fileDocument.fileName + '.part' + part)
    , url = 'http://parts.fuz.io/' + path
    ;

  console.log('Fetching S3 Part ', path);
  // get the s3 object.
  http.get(url, function (response) {

    //console.log('Fetch got response for part', path, response.statusCode, response.headers.etag)
    if(!response.headers || !response.headers.etag || response.statusCode == 403) {
      // clear out this response.  if we don't resume, end will never get called on this
      // response and we'll basically  just hang the socket.
      response.resume();
      self._checkAndFetch(part, callback);
    }
    else {
      callback(null, response);
    }
  }).on('error', function(err) {
    console.log("ERROR (PartFileDownloader - fetchPart) ", path, JSON.stringify(err));
    callback(err);
  })
}

exports.PartFileDownloader = PartFileDownloader;
