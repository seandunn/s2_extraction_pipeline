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
      '<div class="barcode"> ',

      '</div>',
      'Kit Type ',
      '<select class="kitSelect">',
      '<option>DNA</option>',
      '<option>RNA</option>',
      '</select>',
      '<h2>Start Transfers</h2>',
      '<hr />',
      '<div class="row0"></div>',
      '<div class="row1"></div>',
      '<div class="row2"></div>',
      '<div class="row3"></div>',
      '<div class="row4"></div>',
      '<div class="row5"></div>',
      '<div class="row6"></div>',
      '<div class="row7"></div>',
      '<div class="row8"></div>',
      '<div class="row9"></div>',
      '<div class="row10"></div>',
      '<div class="row11"></div>',
      '<p align="right"><button>Print Barcode</button></p>'],
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
