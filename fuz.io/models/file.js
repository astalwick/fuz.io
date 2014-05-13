define(
  [
    'underscore'
  , 'backbone'

  , 'models/base_socket.model'
  ]
, function(_, Backbone, BaseSocketModel) {

  model = {};
  model.idAttribute = '_id';
  model.modelType = 'File';

  model.initialize = function(attributes, options) {
    _.bindAll(this);

    BaseSocketModel.prototype.initialize.apply(this, arguments);
  };
    
  /* ======================================================================= */
  /* ======================================================================= */
  
  return BaseSocketModel.extend(model);
  
});
