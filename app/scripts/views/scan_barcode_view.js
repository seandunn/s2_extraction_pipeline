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
    //debugger;
    if (model !== null) {
      this.model = model;
    }
    /* render the current view onto the screen
     * 
     * Arguments
     * ---------
     * model : the model to display
     */

    var parent = this.jquerySelector(),
        htmlParts = ['<p>Scan ',
          this.model.type ? this.model.type : 'barcode' ,

          '</p><input value="',
          this.model.barcode,
          '"',
          this.model.busy ? ' disabled="true"' : '' ,
          '/>',
          this.model.isValid() ? '' : '<p class="alert-error">Invalid barcode entered</p>',
          '' ],
        htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().append(htmlString);
    var input = parent.find("input");
    var that = this;
    input.on("keypress", function (e) {
      var key = getKey(e);
      if (key === 13) {
        that.owner.childDone(this.owner, "barcodeScanned", this.value);
      }
    });
  };

  ScanBarcodeView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return ScanBarcodeView;

});
