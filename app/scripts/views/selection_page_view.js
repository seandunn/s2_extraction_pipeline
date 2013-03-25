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
      var parts = [
        '<h3 class="alert">',
        '<p>User Barcode : ', model.user, '<p>',
        '<p>Batch UUID : ', model.batch !== undefined ? model.batch : 'new', '<p>',
        '</h3>'
      ];
      parts.push('<ul class="unstyled">');
      for (var i = 0; i < model.capacity; i++) {
        parts.push( '<li>' + i + ' - NO PRESENTER ASSOCIATED WITH THIS ITEM</li>');
      }
      parts.push( "</ul>");
      parts.push('<button class="btn pull-right">Continue</button>');

      /*
      var parts = [
        '<h3 class="alert">',
        '<p>User Barcode : ', model.user, '<p>',
        '<p>Batch UUID : ', model.batch !== undefined ? model.batch : 'new', '<p>',
        '</h3>'
      ];
      parts.push('<table class="table striped">');
      for (var i = 0; i < model.capacity; i++) {
        parts.push( '<tr><td>' + (i+1) + '</td><td>' + i + ' - NO PRESENTER ASSOCIATED WITH THIS ITEM</td></tr>');
      }
      parts.push( "</table>");
      parts.push('<button class="btn pull-right">Continue</button>');
      */

      var html = parts.join('');
      this.jquerySelector().empty().append(html);
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
