define([], function () {

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
    console.log("hello");
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

    var parent = this.jquerySelector(),
      htmlParts = [
        '<h3 class="rowNum"></h3>',
        '<ul class="inline">',
        '<li class="labware1"></li>',
        '<li style="font-size: 6em; padding-top: 100px;" class="arrow">&rarr;</li>',
        '<li>',
        '<div><ul><li class="labware2"></li><li class="spinColumnDesc"><p></p></li></ul></div>',
        '</li>',
        '<li><div class="labware3"></div></li>',
        '</ul><hr />'],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);
  };

//
//  ScanBarcodeView.prototype.getError = function(model) {
//    var errorMessage = model.customError;
//    if (!errorMessage && !model.isValid()) {
//      errorMessage = "Invalid barcode entered";
//    }
//    return errorMessage ? '<p class="alert-error">' + errorMessage + '</p>' : '';
//  }


  rowView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return rowView;

});
