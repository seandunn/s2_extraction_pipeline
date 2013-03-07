define([], function () {

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
      var parts = [ '<div class="details" style="border: 1px solid #d3d3d3; margin:10px; padding: 10px;">',
        '<p>user barcode : ', model.user, '</p>',
        '<p>batch uuid : ', model.batch !== undefined ? model.batch : 'new', '</p>',
        '</div>'
      ];
      parts.push( "<ul style=''>");
      for (var i = 0; i < model.getCapacity(); i++) {
        parts.push( "<li>NO PRESENTER ASSOCIATED TO THIS ITEM</li>");
      }
      parts.push( "</ul>");
      parts.push('<div align="right">');
      parts.push('<button class="nextBtn">next</button>');
      parts.push('</div>');

      var html = parts.join('');
//
      this.jquerySelector().empty().append(html);
//
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
    owner = this.owner;
    button.on("click", function () {
      owner.childDone(owner, "next", undefined);
    });
  };

  SelectionPageView.prototype.clear = function () {
    /* Clears the current view from the screen.
     */
    return this.jquerySelector().empty();
  };

  return SelectionPageView;

});
