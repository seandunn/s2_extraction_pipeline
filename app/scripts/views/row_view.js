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
        '<ul>',
        '<li><h3>Tube</h3><div class="tube"></div></li>',
        '<li style="font-size: 6em; padding-top: 100px;">&rarr;</li>',
        '<li><h3>Spin Column</h3>',
        '<div><ul><li class="spinColumn"></li><li class="spinColumnDesc"><p></p></li></ul></div>',
        '</li>',
        '<li><h3>Waste Tube</h3><div class="wasteTube"></div></li>',
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
