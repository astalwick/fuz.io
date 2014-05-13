define(
  [
    'underscore'
  , 'backbone'

  , 'models/user.js'
  
  ]
, function(_, Backbone, User) {

  model = {};
  
  model.url = function() {
    return window.siteBaseURL + '/api/u/me';
  }

  model.logout = function(callback) {
    $.removeCookie('auth', { path: '/', domain: '.fuz.io' });
    this.fetch( {
        reset: true
      , success: function() {
          callback();
        }
      , error: function() {
          callback('error occurred on currentuser fetch')
        }
    });
  }

  model.loginWithFacebook = function(callback) {
    var that = this;
    console.log('logging in with facebook (' + this.get('_id') + ')')
    FB.login(function(response) {
      console.log('fb login response:', response.authResponse);
      if (response.authResponse) {
        var accessToken = response.authResponse.accessToken;
        FB.api('/me', function(response) {
          console.log('fb /me response', response);
          var postData = {
            userid: that.get('_id'),    // this will get merged.
            fbAccessToken: accessToken,
            fbInfo: response
          };

          $.post(window.siteBaseURL + '/api/u/fbloginsignup', postData, function(data) {
              console.log('fbloginsignup response:', data);
              console.log('LOGIN DATA', data)
              that.handleLoginResponse(data, callback);
            }, 'json')
          .error(callback);

        });
      } else {
        callback(new Error('login failed'));
      }
    }, {scope: 'email'});
  }

  model.loginWithPassword = function(loginInfo, callback) {
    var that = this;
    loginInfo.anonuid = this.get('_id');  // this will get merged
    $.post(window.siteBaseURL + '/api/u/login', loginInfo, function(data) {
      that.handleLoginResponse(data, callback);
    }, 'json').error(callback);
  }

  model.signupWithPassword = function(newUserInfo, callback) {
    var that = this;
    newUserInfo.userid = this.get('_id');
    $.post(window.siteBaseURL + '/api/u/' + this.get('_id') + '/signup', newUserInfo, function(data) {
        console.log('signup response:', data);
        console.log('SIGNUP DATA', data)
        that.handleLoginResponse(data, callback);
    }, 'json').error(callback);
  }

  model.handleLoginResponse = function(data, callback) {
    this.set('_id', data.id);
    this.fetch({
      reset: true

    , success: function() {
        console.log('loginresponse', arguments)
        callback(null, data);
      }
    , error: function() {

        alert('error in handlelogin response fetch')
      }
    });
  }

  model.joinWorkspace = function(wsid, callback) {
    console.log('joining workspace ', wsid)
    var that = this;
    var body = {
      userid : this.get('_id')
    }
    $.post(window.siteBaseURL + '/api/ws/' + wsid  + '/users', body, function(data) {
      console.log('joined workspace ', wsid, data)
      // re-fetch currentuser.
      that.fetch({
        success: function() {
          console.log('fetched currentuser ', wsid, data)
          callback();
        }
      , error: function() {
          callback('error occurred on currentuser fetch')
        }
      })
    }, 'json').error(callback);
  }

  model.initialize = function(attributes, options) {
    $.ajaxSetup({
      cache: false
    });
    _.bindAll(this);

    this.on('change:authToken', function() {
      // TODO: this nees to be testedd
      var auth = !!Backbone.CurrentUser.get('authToken');
      console.log('AUTH TOKEN CHANGED', auth)
      Backbone.trigger('UserAuthenticated', !!auth);
    });

    User.prototype.initialize.apply(this, arguments);
  };

  /* ======================================================================= */
  /* ======================================================================= */
  
  return User.extend(model);
  
});