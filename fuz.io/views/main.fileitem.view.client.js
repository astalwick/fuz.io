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
 
  view.tagName = 'tr';
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


  /* ======================================================================= *
   *  PUBLIC FUNCTIONS                                                       *
   * ======================================================================= */
  view.render = function() {

//    /api/ws/:wsId/files/:fileId/:fileName
    this.$el.html( jade.render('main.fileitem.view.client.jade', {
      fileName: this.model.get('fileName')
    , size: this.model.get('size')
    , uploadedBytes: this.model.get('uploadedBytes')
    , status: this.model.get('state')
    , uploadedBy: this.model.get('uploadedBy').fullName
    , downloadUrl: window.siteBaseURL + '/api/ws/' + this.model.get('workspaceId') + '/files/' + this.model.get('_id') + '/' + encodeURIComponent(this.model.get('fileName'))
    }));
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
    this.model.on('change', this.render)

    this.router = new Backbone.Router();
  }

  /* ======================================================================= */
  /* ======================================================================= */

  return Backbone.View.extend(view);
});
