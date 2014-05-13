var http                = require('http')
  ;

function CompleteFileDownloader(fdoc) {
  this.fileDocument = fdoc;
}

CompleteFileDownloader.prototype.pipe = function(destination) {

  // THIS COULD actually skip node altogether and run through HAPROXY driectly.
  // content.fuz.io maps to the same as data/fuz.io.
  // haproxy recognizes it and proxies the url as http://s3.amazonaws.com/content.fuz.io/URL

  console.log("COMPLETE FILE DOWNLOAD STARTED - " + this.fileDocument.fileName.green)

  var self = this
    , path = self.fileDocument.workspaceId + '/' + encodeURIComponent(self.fileDocument.fileName)
    , url = 'http://content.fuz.io/' + path
  
  http.get(url, function (response) {
    response.pipe(destination);
  }).on('error', function(err) {
    console.log("ERROR (CompleteFileDownloader - pipe) : ".red + JSON.stringify(err));
  });
}

exports.CompleteFileDownloader = CompleteFileDownloader;