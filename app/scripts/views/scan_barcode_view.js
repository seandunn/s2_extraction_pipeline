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

    var parent = this.jquerySelector(),
      htmlParts = [
        '<div style="padding: 3px;"><span style="margin-right:5px;">Scan ',
        this.model.type,
        '</span><input class="barcodeInput" style="width: 9em" value="', model.barcode,
        '"', model.busy ? ' disabled="true"' : '' , '>',
        model.value,
        '</input>',
        '</div>',
        '<div class="alert alert-error" style="max-width: 9em; display: none;">',
        '</div>'
      ],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().append(htmlString);
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

  ScanBarcodeView.prototype.getError = function (model) {
    var errorMessage = model.customError;
    if (!errorMessage && !model.isValid()) {
      errorMessage = "Invalid barcode entered";
    }
    return errorMessage ? '<span class="alert-error">' + errorMessage + '</span>' : '';
  }

  ScanBarcodeView.prototype.displayErrorMessage = function(message) {

    var selection = this.jquerySelector().find('.alert-error');

    var tmp = '<h4 class="alert-heading">Error!</h4>';

    if (message) {
      tmp += message;
    }

    selection.empty().append(tmp);
    selection.css('display', 'block');
  };


  ScanBarcodeView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return ScanBarcodeView;

});
