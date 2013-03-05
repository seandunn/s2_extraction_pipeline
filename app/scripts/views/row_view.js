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

  var ScanBarcodeView = function(owner, jquerySelector) {
console.log("hello");
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  ScanBarcodeView.prototype.renderView = function(model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }

  
    var parent = this.jquerySelector(),
    htmlParts = [
      '<ul>',
      '<li class="tube"></li>',
      '<li style="font-size: 9em; vertical-align: 150%">&rarr;</li>',
      '<li class="spinColumn"></li>',
      '<li class="wasteTube"></li>',
      '</ul><hr />'],
    htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);
    var input = parent.find("input");
    var that = this;
    input.on("keypress", function(e) { 
      var key = getKey(e);
      if (key === 13) {
	that.owner.childDone(this.owner, "barcodeScanned", this.value);
      }
      });    
  };
//
//  ScanBarcodeView.prototype.getError = function(model) {
//    var errorMessage = model.customError;
//    if (!errorMessage && !model.isValid()) {
//      errorMessage = "Invalid barcode entered";
//    }
//    return errorMessage ? '<p class="alert-error">' + errorMessage + '</p>' : '';
//  }



  ScanBarcodeView.prototype.clear = function() {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return ScanBarcodeView;

});
