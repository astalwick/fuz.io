define(
  [ 'underscore'
  , 'backbone'

  , 'models/workspace'
  ]

, function (
    _
  , Backbone

  , Workspace
){

  var router = {};
  
  /* ======================================================================= *
   *  ROUTES CONFIGURATION                                                   *
   * ======================================================================= */
  router.routes = {
    'logout'                            : 'onNavigateLogout'
  , ':wsId'                             : 'onNavigateWorkspace'
  , ''                                  : 'onNavigateRoot'
  }
  
  /* ======================================================================= *
   *  ROUTES HANDLERS                                                        *
   * ======================================================================= */
  router.onNavigateRoot = function() {
    
    var ownedWorkspaces = Backbone.CurrentUser.ownedWorkspaces;
    console.log('nav root - owned workspaceS: ', ownedWorkspaces);

    if(ownedWorkspaces && ownedWorkspaces.length > 0) {
      console.log('navigate root navigating to ', ownedWorkspaces.at(0).get('workspaceId'))
      this.router.navigate(ownedWorkspaces.at(0).get('workspaceId'), {trigger:true, replace:true});
    }
  }

  router.onNavigateWorkspace = function(wsId) {
    console.log('onNavigateWorkspace')
    if(wsId == Backbone.CurrentWorkspaceId)
      return;

    var triggerCurrentWorkspaceChange = function() {
      Backbone.CurrentWorkspaceId = wsId;
      Backbone.trigger('current-workspace', Backbone.CurrentWorkspace);
    }

    if(!Backbone.CurrentUser.getWorkspace(wsId)) 
      Backbone.CurrentUser.joinWorkspace(wsId, triggerCurrentWorkspaceChange);
    else
      triggerCurrentWorkspaceChange();
  }

  router.onNavigateLogout = function() {
    console.log('nav logout')
    var that = this;
    Backbone.CurrentUser.logout(function(err) {
      if(err)
        alert(err);
      else {
        // if we are on the root, we need to auto-nav to a workspace.
        // at this point, the user is guaranteed to have at least one workspace.
        // so, navigate there.
        console.log('navigate logout navigating to /')
        that.router.navigate('/', {trigger: true});
        //if(Backbone.history.fragment === '')
          //router.navigate(Backbone.CurrentUser.ownedWorkspaces.at(0).get('workspaceId'), {trigger:true, replace:true});
      }
    });
  }

  router.onDestroyedWorkspace = function(wsid) {
    var that = this;
    Backbone.CurrentUser.fetch( {
        success: function() {
          var ownedWorkspaces = Backbone.CurrentUser.ownedWorkspaces;

          if(ownedWorkspaces && ownedWorkspaces.length > 0) {
            for (var i = 0; i < ownedWorkspaces.length; i++) {
              if(ownedWorkspaces.at(i).get('workspaceId') != wsid) {
                console.log('navigateing to ' + ownedWorkspaces.at(i).get('workspaceId') )
                that.router.navigate(ownedWorkspaces.at(i).get('workspaceId'), {trigger:true, replace:true});    
                return;
              }
            }
          }

          console.log('nowhere to go after destroyed workspace')
          window.location.href = '/';
        }
      , error: function() {
          // TODO: clean up.
          alert('error occurred on currentuser fetch');
        }
    });  
  }

  /* ======================================================================= *
   *  INIT                                                                   *
   * ======================================================================= */

  router.initialize = function (options) {
    _.bindAll(this);
    this.layoutView = options.layoutView;
    this.router = new Backbone.Router();
    this.listenTo(Backbone, 'workspace-destroyed', this.onDestroyedWorkspace)
  };

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.Router.extend(router);
});



