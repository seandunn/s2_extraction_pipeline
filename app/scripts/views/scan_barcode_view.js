define([], function() {

  function getKey(e) {
    if(window.event) {
      return window.event.keyCode;
    }
    else if(e) {
      return e.which;
    }
    return null;    
    }

  var ScanBarcodeView = function(owner, selection) {
    /* Constructs an instance of ScanBarCode view
     *
     * Arguments
     * ---------
     * owner : the presenter that owns this view
     * selection : the selection point to operate on
     */
    this.owner = owner;
    this.selection = selection;
    return this;
    }

  ScanBarcodeView.prototype.render = function(model) {
    /* render the current view onto the screen
     * 
     * Arguments
     * ---------
     * model : the model to display
     */
      
    var barcodeCell = this.selection.append("td");
    var para = barcodeCell.append("p");
    para.text("Scan barcode");

    var entryCell = this.selection.append("td");
    var input = entryCell.append("input");
    input.attr("value", model.barcode);

    var view = this;
    input.on("keypress", function(e) { 
      var key = getKey(e);
      if (key === 13) {
	view.owner.childDone(this.owner, "barcodeScanned", this.value);
	}
    });

    if (model.busy) {
      input.attr("disabled", "true");
      }

    if(!model.isValid()) {
      console.log("invalid barcode '" + model.barcode + "'");
      var warningCell = this.selection.append("td");
      var warning = warningCell.append("p");
    
      warningCell.attr("class", "alert-error");
      warning.text("Invalid barcode entered");
      }
    }

  ScanBarcodeView.prototype.clear = function() {
    /* clear the view from the current page
     */
    var children = this.selection.selectAll("td");
    children.remove();
    // TODO
    }

  return ScanBarcodeView;

});
