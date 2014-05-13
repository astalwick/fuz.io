define(
  [ 'underscore'
  , 'backbone'

  , 'views/templates.js'
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
    'click .fb-signup'      : 'onSignupWithFacebook'
  , 'click .signup-btn'     : 'onSignupWithPassword'
  };

  view.className = 'modal fade';
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onSignupWithFacebook = function() {
    var that = this;
    console.log('signup clicked')
    Backbone.CurrentUser.loginWithFacebook(function(err) {
      if(err) {
        console.log('error on signup')
        that.signupFailed(err);
      }
      else {
        that.signupSucceeded();
      }
    });
  }

  view.onSignupWithPassword = function() {
    var that = this;
    console.log('signup clicked');

    var newUserInfo = {
      email       : this.$('.email').val(),
      password    : this.$('.password').val(),
      username    : this.$('.username').val(),
      fullname    : this.$('.fullname').val()
    };

    Backbone.CurrentUser.signupWithPassword(newUserInfo, function(err) {
      if(err) {
        console.log('error on signup')
        that.signupFailed(err);
      }
      else {
        that.signupSucceeded();
      }
    });
  }


  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.render = function() {
    this.$el.html(jade.render('modal.signup.view.client.jade', {}));
    this.$el.modal('show');
    return this;
  }

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */
  view.signupSucceeded = function() {
    this.$('.signup-btn').button('reset');

    this.$el.modal('hide');
  }

  view.signupError = function(err) {
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
    this.$('.signup-btn').button('reset');
    this.$('.email').val('');
    this.$('.password').val('');
    this.$('.confirmpassword').val('');
    this.$('.username').val('');
    this.$('.fullname').val('');
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
