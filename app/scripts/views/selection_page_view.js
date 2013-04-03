define(['text!extraction_pipeline/html_partials/selection_page_partial.html'], function (selectionPagePartialHtml) {

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

      //create a list for underscore to iterate through in partial html
      var indices = new Array();

      for (var i = 1; i <= model.capacity; i++){
        indices.push(i);
      };

      var template = _.template(selectionPagePartialHtml);

      // set the user and indices as template data
      var templateData = {
        user: model.user,
        indices: indices
      };


      this.jquerySelector().empty().append(template(templateData));
      this.attachEvents();
    } else {
      this.jquerySelector().empty().append("loading...");
    }

    return this;
  };


  SelectionPageView.prototype.attachEvents = function () {
    /* Renders the next button
     */

    var button = this.jquerySelector().find("div button.nextBtn");
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
