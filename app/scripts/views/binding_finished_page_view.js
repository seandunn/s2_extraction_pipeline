define(['text!extraction_pipeline/html_partials/binding_finished_partial.html'], function (bindingFinishedPartialHtml) {

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

    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    parent.empty().
      append(bindingFinishedPartialHtml);
    var startButton = parent.find(".startButton");
    var printButton = parent.find(".printButton");
    var that = this;

    startButton.on('click', function(e) {
        that.owner.childDone(that, "bindingFinished", {});
    });

    printButton.on('click', function(e) {
        that.owner.childDone(that, "printBarcodes", {});
    });

//    $('li').addClass("kit");
//    $('ul p').addClass("kit");
//    $('ul h3').addClass("kit");
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
