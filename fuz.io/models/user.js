define(
  [
    'underscore'
  , 'backbone'
  , 'collections/workspace_collection.js'
  , 'models/base_socket.model'
  ]
, function(_, Backbone, WorkspaceCollection, BaseSocketModel) {

  model = {};
  model.modelType = 'User'
  model.idAttribute = '_id';
  
  model.url = function() {
    return window.siteBaseURL + '/api/u/' + this.get('id');
  }

  model.parse = function(response, options) {
    console.log('parse', response)

    this.ownedWorkspaces = new WorkspaceCollection(response.ownedWorkspaces || [], {user: this});
    this.sharedWorkspaces = new WorkspaceCollection(response.sharedWorkspaces || [], {user: this});

    return BaseSocketModel.prototype.parse.apply(this, arguments);
  }  

  model.getWorkspace = function(workspaceId) {
    console.log('getworkspace', workspaceId)


    var workspace = Backbone.CurrentUser.ownedWorkspaces.findWhere({'workspaceId': workspaceId});
    if(workspace)
      return workspace;

    workspace = Backbone.CurrentUser.sharedWorkspaces.findWhere({'workspaceId': workspaceId});
    if(workspace)
      return workspace;

    return;
  }

  model.initialize = function(attributes, options) {
    console.log('init user', attributes)
    var that = this;
    _.bindAll(this);
    if(attributes) {
      this.ownedWorkspaces = new WorkspaceCollection(attributes.ownedWorkspaces || [], {user: this});
      this.sharedWorkspaces = new WorkspaceCollection(attributes.sharedWorkspaces || [], {user: this});
    }

    this.on('change:ownedWorkspaces', function() {
      console.log('setting owned workspaces', that.get('ownedWorkspaces'))
      that.ownedWorkspaces.set(that.get('ownedWorkspaces'));
    })
    this.on('change:sharedWorkspaces', function() {
      that.sharedWorkspaces.set(that.get('sharedWorkspaces'));
    })    

    BaseSocketModel.prototype.initialize.apply(this, arguments);

  };
  
  /* ======================================================================= */
  /* ======================================================================= */
  
  return BaseSocketModel.extend(model);
  
});