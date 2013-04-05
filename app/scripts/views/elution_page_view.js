define(['text!extraction_pipeline/html_partials/elution_loading_partial.html'], function (elutionLoadingPartialHtml) {

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var elutionView = function (owner, jquerySelector) {
    console.log("hello");
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  elutionView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }


    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    parent.empty().
      append(elutionLoadingPartialHtml);
    var startButton = parent.find(".startButton");
    var printButton = parent.find(".printButton");
    var that = this;

    startButton.on('click', function(e) {
        that.owner.childDone(that, "elutionStarted", {});
    });
    printButton.on('click', function(e) {
        that.owner.childDone(that, "printOutputTubeBC", {});

    });

//    $('li').addClass("kit");
//    $('ul p').addClass("kit");
//    $('ul h3').addClass("kit");
  };

  elutionView.prototype.setPrintButtonEnabled = function (isEnabled) {
    var printButton = this.jquerySelector().find('.printButton');

    if (isEnabled) {
      printButton.removeAttr('disabled');
    } else {
      printButton.attr('disabled', 'disabled');
    }
  };

//
//  ScanBarcodeView.prototype.getError = function(model) {
//    var errorMessage = model.customError;
//    if (!errorMessage && !model.isValid()) {
//      errorMessage = "Invalid barcode entered";
//    }
//    return errorMessage ? '<p class="alert-error">' + errorMessage + '</p>' : '';
//  }


  elutionView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return elutionView;

});
