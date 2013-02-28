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

  var ScanBarcodeView = function(owner, jquerySelector) {
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

  ScanBarcodeView.prototype.render = function(model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }
    /* render the current view onto the screen
     * 
     * Arguments
     * ---------
     * model : the model to display
     */
  
    var parent = this.jquerySelector(),
    htmlParts = ['<td><p>Scan barcode</p></td>',
		 '<td><input value="',
		 model.barcode, 
		 '"',
		 model.busy ? ' disabled="true"' : '' ,
		 '/></td>',
		 '<td>',
		 model.isValid() ? '' : '<p class="alert-error">Invalid barcode entered</p>', 
		 '</td>' ],
    htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);
    var input = parent.find("input");
    var that = this;
    input.on("keypress", function(e) { 
      var key = getKey(e);
      if (key === 13) {
	that.owner.childDone(this.owner, "barcodeScanned", this.value);
      }
      });

    console.log("html string", htmlString);
    
  };

  ScanBarcodeView.prototype.clear = function() {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return ScanBarcodeView;

});
