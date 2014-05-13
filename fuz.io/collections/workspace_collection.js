define(
  [
    'underscore'
  , 'backbone'
  
  , 'models/workspace'
  ]
, function(_, Backbone, Workspace) {
  
  var collection = {};
  
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  collection.model = Workspace;
  
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  PUBLIC CLASS METHODS                                                   *
   * ======================================================================= */
  collection.url = function() {
    // todo fill this out.
  }

  /* ======================================================================= *
   *  INITIALIZATION                                                         *
   * ======================================================================= */
  /*collection.initialize = function() {
    var that = this;
    this.listenTo(this.user, 'change:ownedWorkspaces', function(){
      that.fetch({
        success: function() {console.log('success fetching')}
      , error: function() {console.log('error fetching')}
      })

    })
    this.listenTo(this.user, 'change:sharedWorkspaces', function(){
      that.fetch({
        success: function() {console.log('success fetching')}
      , error: function() {console.log('error fetching')}
      })

    })
  }*/

   collection.constructor = function(models, options) {
    _.bindAll(this);
    this.model = Workspace;
    this.user = options.user
    
    Backbone.Collection.prototype.constructor.call(this, models, options);
  }
  
  /* ======================================================================= */
  /* ======================================================================= */
  
  return Backbone.Collection.extend(collection);
  
});
