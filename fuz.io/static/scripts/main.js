define(
  [
    'underscore'
  , 'backbone'
  , 'jquery'
  , 'jquery.cookie'

  , 'views/main.view.js'
  , 'models/current_user.js'
  , 'routers/main.router.js'

  , 'socket.io'
  
  ]

, function (_, Backbone, jQuery, jQCookie, MainView, CurrentUser, MainRouter, SocketIO) {
  
  var exports = {};


  
  exports.init = function(options) {
// TODO: er, can't we just listen to the on connect directly on socket?  it's global.
    window._sock = SocketIO.connect();
    window._sock.on('connect', function() {
      Backbone.trigger('socket-connect');
    })

    window._sock.on('disconnect', function() {
      Backbone.trigger('socket-disconnect');
    })

    window._sock.on('reconnect', function() {
      Backbone.trigger('socket-reconnect');
    })

    Backbone.CurrentUser = new CurrentUser();


    Backbone.CurrentUser.fetch( {
        success: function() {
          var layoutView            = new MainView({ el: $('body') })
            , router                = new MainRouter({ layoutView : layoutView })
            ;

          Backbone.history.start({ root : '/', pushState : true });          
          // if we are on the root, we need to auto-nav to a workspace.
          // at this point, the user is guaranteed to have at least one workspace.
          // so, navigate there.
          if(Backbone.history.fragment === '') {


            console.log('navigate main.js navigating to ', Backbone.CurrentUser.ownedWorkspaces.at(0).get('workspaceId'))
            router.navigate(Backbone.CurrentUser.ownedWorkspaces.at(0).get('workspaceId'), {trigger:true, replace:true});
          }

          Backbone.trigger()
        }
      , error: function() {
          // TODO: clean up.
          alert('error occurred on currentuser fetch');
        }
    });
  };
  
  return exports;
  
});
