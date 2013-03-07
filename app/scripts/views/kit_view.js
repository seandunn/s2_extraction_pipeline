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

  var kitView = function (owner, jquerySelector) {
    console.log("hello");
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  kitView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }


    var parent = this.jquerySelector(),
      htmlParts = [
        '<div style="overflow: hidden"><div style="float: left; overflow: auto;">',
        '<div class="barcode"></div>',
        'Kit Type ',
        '<select class="kitSelect">',
        '<option>DNA</option>',
        '<option>RNA</option>',
        '</select></div>',
        '<div style="float: right; overflow: auto;"><p class="validationText"></p></div>',
        '</div>',
        '<h2>Start Transfers</h2>',
        '<hr />',
        '<div class="row0" style="display:inline-table; height:250px;"></div>',
        '<div class="row1" style="display:inline-table; height:250px;"></div>',
        '<div class="row2" style="display:inline-table; height:250px;"></div>',
        '<div class="row3" style="display:inline-table; height:250px;"></div>',
        '<div class="row4" style="display:inline-table; height:250px;"></div>',
        '<div class="row5" style="display:inline-table; height:250px;"></div>',
        '<div class="row6" style="display:inline-table; height:250px;"></div>',
        '<div class="row7" style="display:inline-table; height:250px;"></div>',
        '<div class="row8" style="display:inline-table; height:250px;"></div>',
        '<div class="row9" style="display:inline-table; height:250px;"></div>',
        '<div class="row10" style="display:inline-table; height:250px;"></div>',
        '<div class="row11" style="display:inline-table; height:250px;"></div>',
        '<p align="right"><button class="printButton">Print Barcode</button></p>'],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);

    var input = parent.find("input");
    var selector = parent.find(".kitSelect");
    var that = this;

    $('li').addClass("kit");
    $('ul p').addClass("kit");
    $('ul h3').addClass("kit");

    input.on("keypress", function (e) {
      var key = getKey(e);
      if (key === 13) {
        that.owner.childDone(this.owner, "barcodeScanned", this.value);
      }
    });
    selector.on("change", function (e) {
      that.owner.validateKitTubes();
    });
  };

  kitView.prototype.setKitValidState = function (valid) {
    var result = '';
    var jquerySelection = this.jquerySelector();

    if (valid) {
      result = 'This kit is valid for the selected tubes';
      jquerySelection.
        find('.printButton').removeAttr('disabled');
    }
    else {
      result = 'This kit is not valid for the selected tubes';
      jquerySelection.
        find('.printButton').attr('disabled', 'disabled');
    }

    jquerySelection.
      find('.validationText').
      empty().
      append(result);
  };

//
//  ScanBarcodeView.prototype.getError = function(model) {
//    var errorMessage = model.customError;
//    if (!errorMessage && !model.isValid()) {
//      errorMessage = "Invalid barcode entered";
//    }
//    return errorMessage ? '<p class="alert-error">' + errorMessage + '</p>' : '';
//  }


  kitView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return kitView;

});
