define(
  [ 'underscore'
  , 'backbone'

  , 'views/navbar.view'
  , 'views/main.title.view'
  , 'views/main.invite.view'
  , 'views/main.upload.view'
  , 'views/main.download.view'
  , 'views/side.myworkspaces.view'
  , 'views/side.sharedworkspaces.view'

  , 'views/templates.js'
  ]

, function (
    _
  , Backbone

  , NavbarView
  , TitleView
  , InviteView
  , UploadView
  , DownloadView
  , MyWorkspacesView
  , SharedWorkspacesView
) {

  var view = {};
 
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */
  view.events = {
    'click a' : 'onLinkClick'
  };
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onLinkClick = function (e) {
    var $link         = $(e.currentTarget)
      , href          = $link.attr('href')
      , target        = $link.attr('target')
      , ignoreAnchor  = $link.attr('data-ignore-anchor')
      ;

    if (ignoreAnchor || href == '#' || href == 'javascript:void(0)' || !href)
      e.preventDefault();

    else if (!~['_self', '_blank'].indexOf(target)) {
      e.preventDefault();
      console.log('navigate link click navigating to ', href)
      this.router.navigate(href, {trigger:true});

     // Animate scroll-to the top.
      $('body,html').animate({
        scrollTop: 0
      }, 200);
    }
  };

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.update = function() {
    console.log('updating')
    if(Backbone.CurrentUser.get('plan').type !== 'Anonymous') {
      // we're logged in.
      this.$body.addClass('signed-in')
    }
    else {
      this.$body.removeClass('signed-in');
    }
  }

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */


  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);

    console.log('mainviewinit')
    Backbone.CurrentUser.on('change', this.update);
    Backbone.on('UserAuthenticated', this.update);

    //this.update();

    this.$body            = $('body');
    this.$navbar          = this.$('.navbar');
    this.$title           = this.$('.titleContainer');
    this.$invite          = this.$('#invite');
    this.$upload          = this.$('#upload');
    this.$download        = this.$('#download');
    this.$myws            = this.$('#myworkspaces');
    this.$sharedws        = this.$('#sharedworkspaces');

    this.navbarView       = new NavbarView({ el: this.$navbar });
    this.titleView        = new TitleView({ el: this.$title });
    this.inviteView       = new InviteView({ el: this.$invite });
    this.uploadView       = new UploadView({ el: this.$upload });
    this.downloadView     = new DownloadView({ el: this.$download });
    this.mywsView         = new MyWorkspacesView({ el: this.$myws });
    this.sharedwsView     = new SharedWorkspacesView({ el: this.$sharedws });

    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
