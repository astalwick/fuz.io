define(
  [
    'underscore'
  , 'backbone'
  ]
, function(_, Backbone) {

  model = {};

  model.listen = function() {
    if(!this.id) {
      return;
    }

    this.listeningTo = this.id;

    console.log('SOCK LISTEN', this.modelType + '::'  + this.id);
    window._sock.emit('Listen::' + this.modelType, {id: this.id});
    window._sock.on(this.modelType + '::' + this.id, this.onSocketChange);
  }
  model.stopListening = function() {
    if(this.listeningTo) {
      this.listeningTo = undefined;
      console.log('SOCK STOPLISTEN', this.modelType + '::'  + this.id);
      window._sock.emit('StopListening::' + this.modelType, {id: this.id});
      window._sock.removeListener(this.modelType + '::'  + this.id, this.onSocketChange);
    }
  }
  model.onSocketChange = function(data) {
    console.log('SOCK RCV', this.modelType + '::' + this.id, data)
    this.set(data);
    
    console.log('\tAFTER UPDATE', this.attributes)
  }  

  model.initialize = function(attributes, options) {
    _.bindAll(this);
    var that = this;

    Backbone.on('socket-connect', this.listen);
    Backbone.on('socket-disconnect', this.stopListening);

    this.on('change:' + this.idAttribute, function() {
      if(that.listeningTo) {
        console.log('STOP LISTEN', this.listeningTo)
        that.stopListening();
      }

      that.listen()
    })

    if(window._sock.socket.connected) {
      this.listen();
    }

    Backbone.Model.prototype.initialize.apply(this, arguments);
  };
  
  /* ======================================================================= */
  /* ======================================================================= */
  
  return Backbone.Model.extend(model);
  
});