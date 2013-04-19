define(['text!extraction_pipeline/html_partials/scan_barcode_partial.html'], function (scanBarcodePartialHtml) {

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

  var ScanBarcodeView = function (owner, jquerySelector) {
    /* Constructs an instance of ScanBarCode view
     *
     * Arguments
     * ---------
     * owner : the presenter that owns this view
     * selection : the selection point to operate on
     */
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  ScanBarcodeView.prototype.render = function (model) {
    /* render the current view onto the screen
     * 
     * Arguments
     * ---------
     * model : the model to display
     */
    if (model !== null) {
      this.model = model;
    }

    var parent = this.jquerySelector();

    _.templateSettings.variable = 'rc';

    // Use underscore to insert the model values
    var template = _.template(scanBarcodePartialHtml);
    var templateData = {
      type : this.model.type,
      barcode : this.model.barcode,
      value : this.model.value
    };

    if (model.busy){
      $(".barcodeInput").attr("disabled", "true");
    }

    // We have to append to the document or events won't register
    parent.empty().append(template(templateData));

    var input = parent.find("input");
    var that = this;
    input.on("keypress", function (e) {
      var key = getKey(e);
      if (key === 13) {
        that.setModelBarcode(model);
        if (model.isValid()) {
          that.jquerySelector().find('.alert-error').css('display', 'none');
          that.owner.childDone(this, "barcodeScanned", this.value);
        }
        else {
          that.displayErrorMessage('Invalid Barcode');
        }
      }
    });
  };

  ScanBarcodeView.prototype.setModelBarcode = function(model) {
    model.barcode = this.jquerySelector().find('.barcodeInput').val();
  };

  ScanBarcodeView.prototype.displayErrorMessage = function(message) {

    var selection = this.jquerySelector().find('.alert-error');
    var text = 'Error!';

    if (message) {
      text += message;
    }

    var tmp = $('<h4/>', {
      class: 'alert-heading',
      text: text
    });

    tmp.appendTo(selection.empty());
    selection.css('display', 'block');
  };

  ScanBarcodeView.prototype.focus = function() {
    var selection = this.jquerySelector().find('input');
    selection.focus();
  }

  ScanBarcodeView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return ScanBarcodeView;

});
