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

  var bindingView = function (owner, jquerySelector) {
    console.log("hello");
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  bindingView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }


    var parent = this.jquerySelector(),
      htmlParts = [
        '<h2 class="title">Loading Elution for Order: </h2>',
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
        '<p align="right"><button class="btn printButton">Print Output Tube Barcodes</button><button class="btn startButton">Start Elution process</button></p>'],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);
    var startButton = parent.find(".startButton");
    var that = this;

    startButton.on('click', function(e) {
        that.owner.childDone(that, "elutionStarted", {});
    });

//    $('li').addClass("kit");
//    $('ul p').addClass("kit");
//    $('ul h3').addClass("kit");
  };

  bindingView.prototype.setKitValidState = function (valid) {
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


  bindingView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return bindingView;

});
