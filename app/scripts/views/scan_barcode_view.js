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
        '<div class="input-prepend"><span class="add-on">Scan ',
        '<%- rc.type %>',
        '</span><input type="text" class="barcodeInput" value="', '<%- rc.barcode %>',
        '"', model.busy ? ' disabled="true"' : '' , '>',
        '<%- rc.value %>',
        '</input>',
        '</div>',
        '<div class="alert alert-error hide" >',
        '</div>'
      ],
      htmlString = htmlParts.join('');

    _.templateSettings.variable = 'rc';

    var template = _.template(htmlString);
    var templateData = {
                        type : this.model.type,
                        barcode : this.model.barcode,
                        value : this.model.value
    };

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
