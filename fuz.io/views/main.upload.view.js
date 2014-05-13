define(
  [ 'underscore'
  , 'backbone'

  , 'plupload'

  , 'views/templates.js'
  ]

, function (
    _
  , Backbone
  , PLUpload
) {

  var view = {};
 
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */
  view.events = {
  };
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onFilesAdded = function(up, files) {
    for(var i = 0; i < files.length; i++) {
      console.log('onFilesAdded - sending file ' + files[i].id + ' to '  +'ws/' + Backbone.CurrentWorkspaceId + '/files');
      this.fileURLs[files[i].id] = window.siteBaseURL + "/api/" +'ws/' + Backbone.CurrentWorkspaceId + '/files';
    }
    this.updateQueued(up);
    up.refresh(); // Reposition Flash/Silverlight
    console.log('starting uploader');
    this.uploader.start();
  }

  view.onBeforeUpload = function(up, file) {
    console.log('onBeforeUpload', Backbone.CurrentUser.attributes);
    up.settings.url = this.fileURLs[file.id];
    
    up.settings.multipart_params = {userid: Backbone.CurrentUser.get('_id'), size: file.size};
  }

  view.onUploadFile = function(up, file) {
    console.log('onUploadFile');
    this.$('.currently_uploading').text(file.name + ' (' + plupload.formatSize(file.size) + ')');
    
    this.updateQueued(up);
      
    this.$('.progress-bar').css('width', '0%');
    //this.$('.drop-notice').hide();
    this.$('.uploadcontrol').show();
  }

  view.onUploadProgress = function(up, file) {
    console.log('onUploadProgress', file.percent);
    this.$('.progress-bar').css('width', file.percent + '%');
  }

  view.onFileUploaded = function(up, file) {
    console.log('onFileUploaded');
    delete this.fileURLs[file.id];
    up.removeFile(file);
  }

  view.onUploadComplete = function(up) {
    console.log('onUploadComplete');
    this.$('.uploadcontrol').hide();
    //this.$('.drop-notice').show();
  }

  view.onError = function(up) {
    console.log('ERROR in plupload', arguments)
    up.refresh();
  }

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */
  view.updateQueued = function(up) {
    var queued = '';
    if( up.files.length > 1 ) {
      queued = ' ... and ' + (up.files.length - 1) + ' queued';
      this.$('.currently_uploading').removeClass('nothingqueued');
      this.$('.currently_queued').show();
      this.$('.currently_queued').text( queued );
    }
    else {
      this.$('.currently_uploading').addClass('nothingqueued');
      this.$('.currently_queued').hide();
    }
  }
  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);

    this.fileURLs = {};

    this.uploader = new plupload.Uploader({
        runtimes : 'html5,flash,silverlight,html4'
      , browse_button : 'btnBrowse'
      , container : this.$('#container')[0] //'uploadContainer'
      , drop_element: 'fileDropArea'
      , flash_swf_url : '/static/scripts/plupload/js/Moxie.swf'
      , silverlight_xap_url : '/static/scripts/plupload/js/Moxie.xap'
      , url : window.siteBaseURL + "/api/plupload_not_init"
      , filters : {
          max_file_size : '2000mb',
        }
      , init : {
          FilesAdded        : this.onFilesAdded
        , BeforeUpload      : this.onBeforeUpload
        , UploadFile        : this.onUploadFile
        , UploadProgress    : this.onUploadProgress
        , FileUploaded      : this.onFileUploaded
        , UploadComplete    : this.onUploadComplete
        , Error             : this.onError
        }
    });

    this.uploader.init();

    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
