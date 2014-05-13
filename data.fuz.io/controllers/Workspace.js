var WorkspaceDocument       = require('../models/mongodb/WorkspaceDocument').model
  , UserDocument            = require('../models/mongodb/UserDocument').model
  , FileDocument            = require('../models/mongodb/FileDocument').model
  , Uploader                = require('./FileUploader.js').FileUploader
  , PartFileDownloader      = require('./PartFileDownloader').PartFileDownloader
  , CompleteFileDownloader  = require('./CompleteFileDownloader').CompleteFileDownloader
  , S3File                  = require('../models/s3/S3File')
  , async                   = require('async')
  , mime                    = require('mime')
  , config                  = require('../Config.js')
  , colors                  = require('colors')
  , BLOCK_SIZE              = config.blockSize

  function createWorkspace(userId, title, fn) {
    
    UserDocument.load(userId, function(err, u) {
      if (err)
        return fn(err);

      var ws = new WorkspaceDocument({
        owner: u._id
      , title: title
      , size: 0
      });

      ws.saveAsNew(function(err) {

        if (err)
          return fn(err);

        // add the workspace to the userdoc
        u.addWorkspace(ws, true);
        console.log('saving user')
        u.save(function(err) {
          if( err )
            return fn(err);

          fn(null, ws);
        });
      });
    });
  }
  exports.createWorkspace = createWorkspace;

  function load(workspaceId, fn) {
    WorkspaceDocument.load(workspaceId, fn);
  }
  exports.load = load;

  function addUser(workspaceId, userId, fn) {
    async.waterfall( [
        function(cb) {
          // load the workspace.
          WorkspaceDocument.load(workspaceId, function(err, ws) {
            if (err)
              return cb(err);

            // check if user's already there!
            if(ws.isUserAdded(userId)) {
              return cb({error: 'UserAlreadyAdded'});
            }

            cb(null, ws);
          });
        },
        function(ws, cb) {
          // load the user
          UserDocument.load(userId, function(err, user){ 
            if (err) 
              return cb(err);

            // check if user is already there. 
            // (this is weird - should have been caught above - mismatched?)
            if( user.isWorkspaceAdded(workspaceId) )
              return cb({error: 'WorkspaceAlreadyAdded'});

            cb(null, ws, user); 
          });
        },
        function(ws, user, cb) {
          // ok, now update the workspace.
          ws.addUser(user);
          ws.save(function(err, res) { cb(err, ws, user); })
        },
        function(ws, user, cb) {
          // and, update the user.
          user.addWorkspace(ws);
          user.save(function(err, res) { cb(err, ws, user); })
        }
      ], 
      function(err) {
        if(err)
          console.log("ERROR IN addUser: " + JSON.stringify(err))
        fn(err);
      });
  }
  exports.addUser = addUser;

  function removeUser(workspaceId, userId, fn) {
    async.waterfall( [
      function(cb) {
        // load the workspace.
        WorkspaceDocument.load(workspaceId, cb);
      },
      function(ws, cb) {
        // load the user
        UserDocument.load(userId, function(err, user){ cb(err, ws, user); });
      },
      function(ws, user, cb) {
        // ok, now update the workspace.
        ws.removeUser(user);
        ws.save(function(err, res) { cb(err, ws, user); })
      },
      function(ws, user, cb) {
        // and, update the user.
        user.removeWorkspace(ws, cb);
        user.save(function(err, res) { cb(err, ws, user); })
      }
    ], 
    function(err) {
      if(err)
        console.log("ERROR IN removeUser: " + JSON.stringify(err))      
      fn(err);
    });
  }
  exports.removeUser = removeUser;

  function listFiles(workspaceId, options, fn) {

    console.log('listFiles', options);
    var query = FileDocument.find();
    query.where('workspaceId', workspaceId);
    query.where('uploadTime').exists();
    query.where('deleted').exists(false);
    query.sort({'uploadTime': -1});
    if(options.limit)
      query.limit(options.limit);
    if(options.page);
      query.skip(options.page * options.limit)

    query.exec(fn);
  }
  exports.listFiles = listFiles;

  function listUsers(workspaceId, fn) {
    WorkspaceDocument.load(workspaceId, function(err, ws) {
      if (err)
        fn(err);

      UserDocument.find({_id: { $in: ws.sharedUsers }}, {userName: 1, fullName: 1}, callback);
    });
  }
  exports.listUsers = listUsers;

  function setProperty(workspaceId, propertyName, propertyValue, fn) {

    // note: some properties need to be propagated out.
    // eg, TITLE must propagate out to this user's userdoc, and to all
    // SHARED USER userdocs.

    if(!config.workspaceEditableProperties[propertyName])
      return fn(new Error("Unauthorized property edit: ", propertyName ))

    WorkspaceDocument.load(workspaceId, function(err, ws) {
      if( err )
        return fn(err);

      ws[propertyName] = propertyValue;
      ws.save(function(err) {
        fn(err);
      });
    });
  }
  exports.setProperty = setProperty;

  function updateWorkspaceTitle(workspaceId, title, fn) {
    // for now, we just redir off to 'setProp'
    setProperty(workspaceId, 'title', title, fn);
  }
  exports.updateWorkspaceTitle = updateWorkspaceTitle;

  function getFile(workspaceId, fileId, fn) {
    // ensure that the file is available,
    // respond with a filedownload stream.
    // caller is responsible for piping the stream.
    FileDocument.load(fileId, function(err, fdoc) {
      if( err )
        return fn(err);

      if (fdoc.workspaceId != workspaceId) 
        return fn( new Error("Found the file, but it does not belong to workspace: " + workspaceId + " (belongs to : " + fdoc.workspaceId + ")"));

      if(fdoc.state == 'Cancelled' || fdoc.state == 'Errored'  || fdoc.state == 'Deleted' ) 
        return fn( new Error("Cannot fetch a file that is " + fdoc.state));

      var fileDownloader;
      if (fdoc.state == 'Completed') 
        fileDownloader = new CompleteFileDownloader(fdoc);
      else
        fileDownloader = new PartFileDownloader(fdoc);

      fn(null, fileDownloader, fdoc.fileName, fdoc.size, fdoc.md5);
    })
  }
  exports.getFile = getFile;

  function deleteWorkspace(workspaceId, fn) {
    // simply mark the workspace as 'deleted'
    // it will not be show in any requests for workspaces.
    // it can be cleaned up l ater.
    WorkspaceDocument.load(workspaceId, function(err, ws) {
      if(err)
        return fn(err);

      console.log('deleting workspace ' + ws.workspaceId);
      ws.state = 'Deleted';
      ws.save(function(err) {
        if( err )
          return fn(err);

        // remove owner.
        // callback when it is done.
        removeUser(workspaceId, ws.owner, fn);

        // remove all shared users. (async)
        async.forEach(ws.sharedUsers, function(item, callback) {
          console.log('removing user ' + item + ' from shared user list');
          removeUser(workspaceId, item, callback);
        }, function(err,res){ console.log(err); });
      });
    });
  }
  exports.deleteWorkspace = deleteWorkspace;

  function deleteFile(workspaceId, fileId, fn) {
    // note that we don't update the workspace doc.
    // we leave deleted files in there for awhile.  they are marked as deleted.
    // it is up to the workspace query to ignore deleted files.
    console.log('workspace.js deleting file ' + workspaceId + '/' + fileId)
    async.waterfall([
      function(callback) {
        FileDocument.load(fileId, callback);
      }, 
      function(fileDoc, callback){
        console.log('fdocLoaded')
        if(fileDoc.state == 'Deleted') {
          // we're already done.
          return fn();
        }
        if(fileDoc.state == 'Uploading') {
          console.log('cannot delete uploading file');
          return fn(new Error('Cannot delete a file while it is uploading.'));
        }

        // actually, no need to wait. 
        fn();

        // file exists and is not already deleted
        fileDoc.state = 'Deleted';
        fileDoc.deletedTime = Date.now();
        fileDoc.save(function(err) {
          console.log('file deleted') ;
          callback(err, fileDoc);   
        });
      },
      function(fileDoc, callback) {
        // it's deleted in the doc.

        // no need to delete the parts - they autoexpire.
        // only need to delete the complete file.
        console.log('issuing delete for ' + fileDoc.workspaceId + '/' + fileDoc.fileName)
        S3File.deleteFile('content.fuz.io', fileDoc.workspaceId + '/' + fileDoc.fileName, function(err, res) {
          callback(err, fileDoc);
          updateWorkspaceSize(workspaceId);
        });
      }], 
      function(err) {
        if (err) {
          console.log('ERROR in deleteFile - ' + JSON.stringify(err));
        }
      });
  }
  exports.deleteFile = deleteFile;

  function updateWorkspaceSize(workspaceId, fn) {
    var query = FileDocument.find({});
    query.where('workspaceId', workspaceId);
    query.or([{state: 'Uploading'}, {state: 'Completed'}]);
    query.select('size');
    query.exec(function(err, results) {
      
      var sum = 0;
      for( var i = 0 ; i < results.length; i++ )
        sum += results[i].size;

      console.log('SIZE OF WORKSPACE: ' + sum);
      WorkspaceDocument.update({'workspaceId' : workspaceId}, { $set: { 'size': sum }}, function(err, res) {
        if(fn)
          fn(err);
      });
    });
  }
  exports.updateWorkspaceSize =updateWorkspaceSize;
  
  function uploadFile(workspaceId, form, fn) {

    var userId
      , userName
      , fileSize
      , uploader
      , fileName
      , uploadedBy
      , fdoc
      , cancelled
      ;     

    function _formBackpressure(part, uploader) {
      // formidable's 'part' isn't a real stream, it's a 'stream'-like stream.
      // that means that it implements some stream methods, but isn't a 
      // completely legit stream.
      // the core problem: it doesn't handle backpressure correctly.
      // so, instead of just piping, we need to do 'on data pause' stuff.
      // (i stole this code directly (small mods) from formidable/lib/incoming_form.js)
      // (from the formfile -> diskfile handling routines)
      form._flushing++;
      part.on('data', function(buffer) {
        if(cancelled)
          return;
        if (buffer.length == 0)
          return;
        
        form.pause();
        uploader.write(buffer, function() {
          form.resume();
        });
      });

      part.on('end', function() {
        uploader.end(function() {
          form._flushing--;
          form._maybeEnd();
        });
      });
    }

    function _popCallback(args) {
      return Array.prototype.slice.call(args).pop();
    }

    function _initNewFile(part) {
      fdoc = new FileDocument({
          workspaceId       : workspaceId
        , size              : fileSize
        , fileName          : part.filename
        , state             : 'Uploading'
        , mimeType          : mime.lookup(part.filename)
        , uploadTime        : Date.now()
        , totalBlocks       : Math.ceil(fileSize / BLOCK_SIZE)
        , blockSize         : BLOCK_SIZE
        , uploadedBytes     : 0
        , uploadedBy        : userId        
      });

      async.waterfall([
          function(callback) {
            console.log('saving fdoc'.red)
            fdoc.save(_popCallback(arguments))
          }
        , function(callback) {

            console.log( ('updating workspace document - adding file ' + fdoc._id).red );
            WorkspaceDocument.load(workspaceId, _popCallback(arguments));
          }
        , function(ws, callback) {
            console.log('adding file to ws'.red)
            ws.files.push(fdoc._id);
            ws.save(_popCallback(arguments));
          }
        , function(callback) {
            console.log('updaing workspace size'.red)
            updateWorkspaceSize(workspaceId, _popCallback(arguments));
          }]
      , function(err) {
          if (err) {
            console.log("ERROR INITIALIZING FILE", err) ;
            uploader.cancelUpload();            
            return;
          }
        });
    }

    function _fieldParser(name, value) {
      //console.log('field parsed - ' + name + '=' + value);
      if( name == 'userid' )
        userId = value;
      else if( name == 'username' )
        userName = value;
      else if( name == 'size')
        fileSize = value;
    }

    function _partCompleteListener(part, uploadedBytes) {
      fdoc.uploadedBytes += uploadedBytes;
      // partcomplete is going to tell us the part number of the part that just completed.
      // this number is zero-based
      // the filedocument contains the total number of blocks uploaded.  1-based.
      // hence the +1.
      if( !fdoc.uploadedBlocks || part + 1 > fdoc.uploadedBlocks ) {
        fdoc.uploadedBlocks = part + 1;
        
        fdoc.save(function(err) { if(err) console.log( JSON.stringify(err)); })
      }
    }

    function _uploadCompleteListener(hash) {
      console.log("UPLOAD COMPLETE!  HOOORAAAAYY! --- md5: " + hash)
      fdoc.state = "Completed";
      fdoc.md5 = hash;
      fdoc.save(function(err) { 
        if(err) console.log( JSON.stringify(err)); 
        updateWorkspaceSize(workspaceId);
      })
    }

    function _uploadError() {
      console.log('marking fdoc as cancelled')
      if(fdoc.state != 'Errored') {
        fdoc.state = 'Errored';
        fdoc.save(function(err) { 
          if(err) console.log( JSON.stringify(err)); 
          updateWorkspaceSize(workspaceId);
        })
      }
    }

    function _uploadCancelled() {
      console.log('marking fdoc as cancelled')
      if(fdoc.state != 'Cancelled') {
        fdoc.state = "Cancelled";
        fdoc.save(function(err) { 
          if(err) console.log( JSON.stringify(err)); 
          updateWorkspaceSize(workspaceId);
        })
      }      
    }

    function _handleUpload(part) {
      // ok, cool, we have a new file.
      console.log('beginning file upload for ', part.filename);

      uploader = new Uploader({
          fileName        : part.filename
        , workspaceId     : workspaceId
        , userId          : userId
        , fileSize        : fileSize
        , mimeType        : mime.lookup(part.filename)
        , blockSize       : BLOCK_SIZE
      });

      _formBackpressure(part, uploader);
      _initNewFile(part)

      uploader.addListener('partcomplete', _partCompleteListener);
      uploader.addListener('uploadcomplete', _uploadCompleteListener);
      uploader.addListener('error', _uploadError);
      uploader.addListener('cancelled', _uploadCancelled);
    }

    form.on('field', _fieldParser);
    form.onPart = function onPart(part) {
      if (!part.filename) {
        // let formidable handle (and drop) all non-file-data parts.
        form.handlePart(part);
      }
      else {
        _handleUpload(part);
      }
    }

    form.on('error', function(err) {
      console.log('form parse error', err)
      uploader.cancelUpload();
      return fn(new Error("Form parse error - " + JSON.stringify(err)));
    });
    form.on('aborted', function(err) {
      console.log('form aborted')
      uploader.cancelUpload();
      return fn(new Error("Upload aborted - " + JSON.stringify(err)));
    });
    form.on('end', function() {
      return fn();
    });
  }
  exports.uploadFile = uploadFile;
