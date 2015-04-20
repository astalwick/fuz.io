var socketio  = require('socket.io')
  , redis     = require('redis')
  , _         = require('underscore')
  , Config    = require('../Config.js')
  ;

exports.register = function(server) {
  var io = socketio.listen(server);

  io.sockets.on('connection', function (socket) {
    var listening = {};
    console.log('socket.io connection!', socket.id)

    var listen = function(type, data) {
      console.log('socket.io ('+socket.id+') Listen::' + type, data)
      if(listening[type + '::' + data.id]) {
        console.log('socket.io ('+socket.id+') already listening: ' + type + '::' + data.id)
        return;
      }
      // register to the redispubsub for this workspace item
      redis_client.subscribe(type + '::' + data.id);
      listening[type + '::' + data.id] = true;
    }

    var stopListening = function(type, data) {
      if(!listening[type + '::' + data.id])
        return;

      redis_client.unsubscribe(type + '::' + data.id);
      listening[type + '::' + data.id] = false;
    }

    var redis_client = redis.createClient(6379, Config.redisHost);
    redis_client.on('message', function(channel, message) {
      console.log('SOCKET ('+socket.id+') EMIT ' + channel)
      socket.emit(channel, JSON.parse(message));
    }); 

    socket.on('Listen::File', _.partial(listen, 'File'));
    socket.on('Listen::User', _.partial(listen, 'User'));
    socket.on('Listen::Workspace', _.partial(listen, 'Workspace'));
    socket.on('StopListening::File', _.partial(stopListening, 'File'));
    socket.on('StopListening::User', _.partial(stopListening, 'File'));
    socket.on('StopListening::Workspace', _.partial(stopListening, 'File'));

    socket.on('error', function() {
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log(arguments)
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')
      console.log('SOCKET IO ERROR('+socket.id+')')    
    })
    socket.on('disconnect', function () {
      console.log('socket ('+socket.id+') disconnect!')
      redis_client.unsubscribe();
      listening = {};
      redis_client.end();
    });
  });
}