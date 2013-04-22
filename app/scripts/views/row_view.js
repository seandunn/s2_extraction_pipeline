define(['text!extraction_pipeline/html_partials/row_partial.html'], function (rowPartialHtml) {

  'use strict';

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var rowView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  rowView.prototype.removeArrow = function() {
    this.jquerySelector().find('.arrow').empty();
  };

  rowView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }

    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    parent.empty().
      append(rowPartialHtml);
  };

  rowView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return rowView;

});
