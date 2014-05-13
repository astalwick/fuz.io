define(
  [
    'underscore'
  , 'backbone'
  , 'models/base_socket.model'
  
  ]
, function(_, Backbone, BaseSocketModel) {

  model = {};

  model.idAttribute = 'workspaceId';
  model.modelType = 'Workspace';

  model.url = function() {
    if(this.isNew())
      return window.siteBaseURL + '/api/ws';
    return window.siteBaseURL + '/api/ws/' + this.get('workspaceId');
  }
  model.save = function() {
    console.log('model save');

    // TODO: we shouldn't actually need this.
    // Anyone that cares should care about the collection, i think.
    if(this.isNew())
      Backbone.trigger('workspace-created', this.get('workspaceId'), this);

    BaseSocketModel.prototype.save.apply(this, arguments);
  }
  model.destroy = function() {
    console.log('workspace destroyed');
    Backbone.trigger('workspace-destroyed', this.get('workspaceId'));
    BaseSocketModel.prototype.destroy.apply(this, arguments);
  }

  model.initialize = function(attributes, options) {
    console.log('initing workspace', attributes)
    _.bindAll(this);

    BaseSocketModel.prototype.initialize.apply(this, arguments);
  };
    
  /* ======================================================================= */
  /* ======================================================================= */
  
  return BaseSocketModel.extend(model);
  
});