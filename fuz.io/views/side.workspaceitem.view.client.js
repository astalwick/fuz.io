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
 
  view.tagName = 'li';
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

  view.updateActiveWorkspace = function() {
    if(Backbone.CurrentWorkspaceId == this.model.get('workspaceId')) {
      this.$el.addClass('active');
    }
    else if(this.$el.hasClass('active')) {
      this.$el.removeClass('active');
    }
  }

  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.render = function() {
    this.$el.html( jade.render('side.workspaceitem.view.client.jade', {
      title: this.model.get('title')
    , workspaceId: this.model.get('workspaceId')
    }));
    this.updateActiveWorkspace();
    return this;
  }

  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */

  /* ======================================================================= *
   *  CONSTRUCTOR & INITIALIZATION                                           *
   * ======================================================================= */

  view.initialize = function (options) {
    _.bindAll(this);
    this.model = options.model;

    Backbone.on('current-workspace', this.updateActiveWorkspace);
    this.listenTo(this.model, 'change', this.render);
    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
