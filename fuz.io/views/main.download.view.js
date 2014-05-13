define(
  [ 'underscore'
  , 'backbone'

  , 'collections/file_collection'

  , 'views/main.fileitem.view.client'

  , 'views/templates.js'
  ]

, function (
    _
  , Backbone
  , FileCollection
  , FileItemView


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
  view.onCurrentWorkspaceChanged = function() {
    var that = this;
    if(this.collection) {
      this.collection.off();
      delete this.collection;
    }

    if(this.pollInterval)
      clearInterval(this.pollInterval);

    this.$('.incomingFiles').html('');

    this.collection = new FileCollection([],{workspace: Backbone.CurrentUser.getWorkspace(Backbone.CurrentWorkspaceId)});
    this.collection.on('add', this.addItem);
    this.collection.fetch({
      success: function() {
        if(!that.collection.length) {
          that.$('.incomingFiles').html(jade.render('main.download.nofiles.view.client.jade'));
        }
      }
    , error: function() {
        alert('error on file list fetch');
      }
    });
  }


  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */
  view.addItem = function(model) {
    this.$('.incomingFiles #nofiles').remove();
    this.$('.incomingFiles').append(new FileItemView({model: model}).render().el);
  }

  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);
    Backbone.on('current-workspace', this.onCurrentWorkspaceChanged)
    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
