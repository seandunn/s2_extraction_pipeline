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
        '<h2 class="title">Binding Complete for order: </h2>',
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
        '<p align="right"><button class="finishButton">Finish Binding</button></p>'],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);
    var finishButton = parent.find(".finishButton");
    var that = this;

    finishButton.on('click', function(e) {
        that.owner.childDone(that, "bindingComplete", {});
    });

    $('li').addClass("kit");
    $('ul p').addClass("kit");
    $('ul h3').addClass("kit");
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
