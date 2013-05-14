define(['text!extraction_pipeline/html_partials/selection_page_partial.html'], function (selectionPagePartialHtml) {
  'use strict';

  var SelectionPageView = function (owner, selection) {
    /* Constructor for SelectionPageView
     *
     * Arguments
     * ---------
     * owner :    the presenter that owns this class. Expected to be an
     *            instance of SelectionPagePresenter
     * selection: A jquery selection. This is converted to be a d3 selection
     *            for rendering. 
     */
    this.owner = owner;
    this.jquerySelector = selection;
    return this;
  };

  SelectionPageView.prototype.render = function (model) {
    /* Renders the current view from the given model
     *
     * Arguments
     * ---------
     * model : the model to render

     */
    if (model) {

      var template = _.template(selectionPagePartialHtml);

      this.jquerySelector().html(template({
        user: model.user,
        numRows: model.capacity,
        processTitle: model.processTitle,
        labwareTitle: model.labwareTitle
      }));
      this.attachEvents();
    } else {
      this.jquerySelector().empty().append("loading...");
    }

    return this;
  };


  SelectionPageView.prototype.attachEvents = function () {
    /* Renders the next button
     */

    var button = this.jquerySelector().find("button.btn");
    var thatOwner = this.owner;
    var that = this;
    button.on("click", function () {
      thatOwner.childDone(that, "next", undefined);
    });
  };

  SelectionPageView.prototype.clear = function () {
    /* Clears the current view from the screen.
     */
    return this.jquerySelector().empty();
  };

  return SelectionPageView;

});
