var redis         = require('redis')
  , Config        = require('../../Config.js')
  , redis_client  = redis.createClient(6379, Config.redisHost);


module.exports = exports = function broadcastPlugin (schema, options) {
  schema.post('save', function (doc) {
    //
    // notify the change out via socket.io
    //
    var key = options.key ? options.key : '_id';
    //console.log('redis_client SAVE', options.name + '::' + doc[key])
    doc.mapToClientDocument(function(err, clientDoc) {
      redis_client.publish(options.name + '::' + clientDoc[key], JSON.stringify(clientDoc));	
    })
    
  })
}
