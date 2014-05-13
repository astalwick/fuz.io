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
      'click      .rename-workspace'            : 'beginRename'
    , 'click      .delete-workspace'            : 'onDeleteWorkspace'
    /*, 'keypress   .workspace-title-edit'        : 'onRenameKeypress'
    , 'blur       .workspace-title-edit'        : 'onRenameBlur'*/
  };
   
  /* ======================================================================= *
   *  EVENT HANDLERS                                                         *
   * ======================================================================= */

  view.onCurrentWorkspaceChanged = function(ws) {
    if(this.currentWorkspace)
      this.currentWorkspace.off('change', this.update);

    console.log('Backbone.CurrentWorkspaceId', Backbone.CurrentWorkspaceId)
    console.log('Backbone.CurrentWorkspace', Backbone.CurrentUser.getWorkspace(Backbone.CurrentWorkspaceId))
    this.currentWorkspace = Backbone.CurrentUser.getWorkspace(Backbone.CurrentWorkspaceId);
    this.currentWorkspace.on('change', this.update);

    this.update();
  }

  view.beginRename = function(e) {
    this.$('.workspace-title').addClass('hide');
    this.$('.workspace-option-link').addClass('hide');
    this.$('.workspace-title-edit').removeClass('hide');
    this.$('.workspace-title-edit').focus();
    this.$('.workspace-title-edit').select();

    this.$('.workspace-title-edit').on('blur', this.onRenameBlur);
    this.$('.workspace-title-edit').on('keypress', this.onRenameKeypress);

    e.preventDefault();
  }

  view.endRename = function() {
    $('.workspace-title').removeClass('hide');
    $('.workspace-option-link').removeClass('hide');
    $('.workspace-title-edit').addClass('hide');

    this.$('.workspace-title-edit').off('blur', this.onRenameBlur);
    this.$('.workspace-title-edit').off('keypress', this.onRenameKeypress);
  }

  view.onRenameBlur = function(e) {
    console.log('blur')
    this.currentWorkspace.set('title', $('.workspace-title-edit').val());
    this.currentWorkspace.save();
    this.endRename();
  }

  view.onRenameKeypress = function(e) {
    if(e.which == 13) {

      this.currentWorkspace.set('title', $('.workspace-title-edit').val());
      this.currentWorkspace.save();
      e.preventDefault();
      this.endRename();
      return false;
    }
    
    else if(e.which == 27) {
      $('.workspace-title-edit').val($('.workspace-title').text());
      this.endRename();
      return false;
    }
  }

  view.onDeleteWorkspace = function() {
    var that = this;
    this.currentWorkspace.destroy();
  }

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.update = function() {
    this.$('.workspace-title').text(this.currentWorkspace.get('title'));
    this.$('.workspace-title-edit').val(this.currentWorkspace.get('title'));
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
    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
