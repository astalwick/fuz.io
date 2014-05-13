define(
  [ 'underscore'
  , 'backbone'

  , 'views/templates.js'
  ]

, function (
    _
  , Backbone
) {

  var view = {};

  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */
  view.events = {
      'click .signup'             : 'onSignup'
    , 'click .login'              : 'onLogin'
    , 'click .logout'             : 'onLogout'
  };
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onLogin = function() {
    var that = this;
    require(['views/modal.login.view.client'], function(LoginModalView) {
      new LoginModalView().render();
    });
  }

  view.onLogout = function() {
    this.router.navigate('/logout', {trigger:true});
  }

  view.onSignup = function() {
    var that = this;
    require(['views/modal.signup.view.client'], function(SignupModalView) {
      new SignupModalView().render();
    });
  }

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.update = function() {
    this.$('.username').text(Backbone.CurrentUser.get('fullName'))
  }
  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */

  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);
    Backbone.CurrentUser.on('change', this.update);
    this.update();
    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
