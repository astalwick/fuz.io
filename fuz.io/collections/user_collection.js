define(
  [
    'underscore'
  , 'backbone'
  
  , 'models/user'
  ]
, function(_, Backbone, User) {
  
  var collection = {};
  
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  collection.model = User;
  
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  
  
  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */
  collection.url = function() {
    return window.siteBaseURL + '/api/ws/' + this.workspaceId + '/users';
  }
  /* ======================================================================= *
   *  INITIALIZATION                                                         *
   * ======================================================================= */
   
  collection.constructor = function(models, options) {
    _.bindAll(this);

    // work around what seems to be a bug with backbone 1.1.0.
    // collection.model gets overwritten by a function(){[native code]}
    // as soon as bindall(this) is done.  that causes everyting to break.
    // backbone 1.0.0 doesn't have this behaviour.  not sure what's up.
    // TODO: check if this works when updating from backbone 1.1.0
    // (dont' forget other collections)
    this.model = User;
    console.log('USER', this.model, collection.model)

    this.workspaceId = options.workspaceId;
    
    Backbone.Collection.prototype.constructor.call(this, models, options);
  }
  
  /* ======================================================================= */
  /* ======================================================================= */
  
  return Backbone.Collection.extend(collection);
  
});
