define(['text!extraction_pipeline/html_partials/kit_partial.html'], function (kitPartialHtml) {

  var that = this;
  function onNext_clicked(owner, view) {
    /*
     * response to the click on the login button...
     * tells the owner that we want to try a login
     */
    return function () {
      if (owner) {
        owner.childDone(view , "next",{ });
      }
    }
  }


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

    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    parent.empty().
      append(kitPartialHtml);

    var input = parent.find("input");
    var selector = parent.find(".kitSelect");
    var printBtn = parent.find(".printButton");
    var that = this;

    printBtn.on('click', function(e) {
      that.owner.childDone(that, "printBC", {});
    });

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
      that.owner.setValidState();
    });

    this.jquerySelector().find(".nextBtn").click(onNext_clicked(this.owner, this));



  };

  kitView.prototype.setKitValidState = function (valid) {
    var result = '';
    var jquerySelection = this.jquerySelector();

    if (valid) {
      result = '<div class="alert alert-success">This kit is valid for the selected tubes</div>';
      jquerySelection.
        find('.printButton').removeAttr('disabled');
    }
    else {
      result = '<div class="alert alert-error">This kit is not valid for the selected tubes</div>';
      jquerySelection.
        find('.printButton').attr('disabled', 'disabled');
    }

    jquerySelection.
      find('.validationText').
      empty().
      append(result);
  };

  kitView.getKitTypeSelection = function() {
    return this.jquerySelector().find('.kitSelect').val().split('/');
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
    this.jquerySelector().empty();
  };

  return kitView;

});
