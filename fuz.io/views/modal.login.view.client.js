define(
  [ 'underscore'
  , 'backbone'

  , 'views/templates'
  , 'bootstrap'
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
    'click .fbsignin'     : 'onLoginWithFacebook'
  , 'click .login-btn'    : 'onLoginWithPassword'
  };

  view.className = 'modal fade';
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onLoginWithFacebook = function() {
    var that = this;
    Backbone.CurrentUser.loginWithFacebook(function(err) {
      if(err) {
        that.loginFailed(err);
      }
      else {
        that.loginSucceeded();
      }
    });
  }

  view.onLoginWithPassword = function() {
    var that = this;

    var loginInfo = {
      email       : this.$('.email').val(),
      password    : this.$('.password').val()
    };

    Backbone.CurrentUser.loginWithPassword(loginInfo, function(err) {
      if(err) {
        console.log('error on login')
        that.loginFailed(err);
      }
      else {
        that.loginSucceeded();
      }
    });
  }
  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.render = function() {
    this.$el.html( jade.render('modal.login.view.client.jade', {}));
    this.$el.modal('show');
    return this;
  }
  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */
  view.loginSucceeded = function() {
    this.$('.login-btn').button('reset');
    this.$('.fbsignin').button('reset');

    this.$el.modal('hide');

    console.log('loginsucceeded')

    if(!Backbone.CurrentUser.getWorkspace(Backbone.CurrentWorkspaceId)) {
      this.router.navigate('/', {trigger:true, replace:true});
    }
  }

  view.loginFailed = function(err) {
    var text = 'An error occurred.  Please try again.';

    if( err && err.responseText ) {
      var obj = JSON.parse(err.responseText)
      if( obj && obj.meta && obj.meta.errordesc ) {
        text = obj.meta.errordesc;
        console.log("error " +obj.meta.errordesc);
      }
    }
    
    // show the alert
    this.$('.alert-message').text(text);
    this.$('.alert').show();

    // reset the form fields
    this.$('.login-btn').button('reset');

    this.$('.email').val('');
    this.$('.password').val('');
  }
  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);
    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
