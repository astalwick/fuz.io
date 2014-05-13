define(
  [
    'underscore'
  , 'backbone'
  
  , 'models/file'
  ]
, function(_, Backbone, File) {
  
  var collection = {};
  
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  collection.model = File;

  collection.url = function() {
    return window.siteBaseURL + '/api/ws/' + this.workspace.id + '/files';
  }

  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */

  /* ======================================================================= *
   *  INITIALIZATION                                                         *
   * ======================================================================= */

  collection.initialize = function() {
    var that = this;
    this.listenTo(this.workspace, 'change:files', function(){
      that.fetch({
        success: function() {console.log('success fetching')}
      , error: function() {console.log('error fetching')}
      })

    })
  }
   
  collection.constructor = function(models, options) {
    _.bindAll(this);

    // work around what seems to be a bug with backbone 1.1.0.
    // collection.model gets overwritten by a function(){[native code]}
    // as soon as bindall(this) is done.  that causes everyting to break.
    // backbone 1.0.0 doesn't have this behaviour.  not sure what's up.
    // TODO: check if this works when updating from backbone 1.1.0
    // (dont' forget other collections)    
    this.model = File;

    if(!options) options = {};

    this.workspace = options.workspace;
    Backbone.Collection.prototype.constructor.call(this, models, options);
  }
  
  /* ======================================================================= */
  /* ======================================================================= */
  
  return Backbone.Collection.extend(collection);
  
});
