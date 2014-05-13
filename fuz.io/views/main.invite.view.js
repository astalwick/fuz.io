define(
  [ 'underscore'
  , 'backbone'
  , 'static/scripts/zeroclipboard/ZeroClipboard'
  , 'views/templates.js'    
  , 'bootstrap'
  
  ]

, function (
    _
  , Backbone
  , ZeroClipboard

) {

  var view = {};
 
  /* ======================================================================= *
   *  ATTRIBUTES                                                             *
   * ======================================================================= */
  
  /* ======================================================================= *
   *  EVENTS                                                                 *
   * ======================================================================= */
  view.events = {
  };

  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */
  view.onCurrentWorkspaceChanged = function(ws) {
    if(this.currentWorkspace)
      this.currentWorkspace.off('change', this.update);

    this.currentWorkspace = Backbone.CurrentUser.getWorkspace(Backbone.CurrentWorkspaceId);
    this.currentWorkspace.on('change', this.update);

    this.update();
  }

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.update = function() {
    var that = this;
    this.$('.workspaceurl').text('https://fuz.io/' + Backbone.CurrentWorkspaceId);
    this.$('.copy').attr('data-clipboard-text', 'https://fuz.io/' + Backbone.CurrentWorkspaceId);
    this.clipper = new ZeroClipboard(this.$('.copy'));
    this.clipper.on('complete', function() {
      that.$('.copy').tooltip('show');

      setTimeout(function(){that.$('.copy').tooltip('hide');}, 1000);
    })
  }

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */

  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);
    Backbone.on('current-workspace', this.onCurrentWorkspaceChanged)
    ZeroClipboard.setDefaults( { moviePath: 'static/scripts/zeroclipboard/ZeroClipboard.swf' } );

    this.$('.copy').tooltip({'trigger' : 'manual'});

    this.clipper = new ZeroClipboard();
    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
