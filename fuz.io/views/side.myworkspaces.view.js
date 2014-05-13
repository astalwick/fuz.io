define(
  [ 'underscore'
  , 'backbone'

  , 'collections/workspace_collection'

  , 'views/side.workspaceitem.view.client'

  , 'views/templates.js'

  ]

, function (
    _
  , Backbone

  , WorkspaceCollection

  , WorkspaceItemView

) {

  var view = {};
 
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */
  view.events = {
    'click .create-workspace'           : 'onCreateWorkspace'
  };
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onCreateWorkspace = function(e) {
    var that = this;
    var newWorkspace = new this.collection.model({title: 'Empty Workspace'});

    newWorkspace.save({}, {success: function(model, response, options) {
      console.log('success')
      console.log(model);
      that.collection.add(model);
    }});
  }

  view.addItem = function(model, collection, options) {
    console.log('additem called');
    var that = this;
    var x = new WorkspaceItemView({model:model});
    
    Backbone.on('workspace-destroyed', function(workspaceId) {
      if(model.get('workspaceId') !== workspaceId)
        return;
      x.remove();
      that.collection.remove(model);
    });
    
    this.$('.workspace-list').append(x.render().el);
  }

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.render = function() {
    var that = this;
    console.log('render called', this.collection.models);
    this.$('.workspace-list').html('');
  }

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */

  view.updateCurrentUser = function() {
    var that = this;
    if(that.collection)
      that.collection.off();

    console.log('current user change');
    that.collection = Backbone.CurrentUser.ownedWorkspaces;
    that.collection.on('add', that.addItem);

    that.render();
    
    that.collection.forEach(function(item) {
      console.log('INIT MYWORKSPACES',
        item)
      that.addItem(item, that.collection);
    });    
  }

  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);
    var that = this;

    Backbone.CurrentUser.on('change', this.updateCurrentUser);
    this.updateCurrentUser();

    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
})
