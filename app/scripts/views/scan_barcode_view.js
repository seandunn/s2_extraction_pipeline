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

  var ScanBarcodeView = function(owner, placeholderSelector) {
    /* Constructs an instance of ScanBarCode view
     *
     * Arguments
     * ---------
     * owner : the presenter that owns this view
     * selection : the selection point to operate on
     */
    this.owner = owner;
    this.placeholderSelector = placeholderSelector;

    return this;
  };

  ScanBarcodeView.prototype.generateTree = function(model) {
    /* render the current view onto the screen
     * 
     * Arguments
     * ---------
     * model : the model to display
     */
      
    var parts =[ document.createElement("td"),
		 document.createElement("td"),
		  document.createElement("td") ];

    var barcodeCell = d3.select(parts[0]);
    var para = barcodeCell.append("p").text("Scan barcode");
//<td><p>Scan barcode</p></td>");

    var entryCell = d3.select(parts[1]);
    var input = entryCell.append("input");
    input.attr("value", model.barcode);
    if(model.busy) {
      input.attr("disabled", "true");
    }
 
    console.log("entryCell:",  entryCell);
    console.log("$entryCell:", $(entryCell));
    console.log("input: ", input);
//    var view = this;
    input.on("click", function() { 
      alert("oioi");
    });
     
//      var key = getKey(e);
  //    if (key === 13) {
//	view.owner.childDone(this.owner, "barcodeScanned", this.value);
//    });

    console.log("input.onclick", input.onclick);

  //  if (model.busy) {
   //   input.attr("disabled", "true");
   // }

 //   if(!model.isValid()) {
  //    console.log("invalid barcode '" + model.barcode + "'");
   //   var warningCell = parts[2];
    //  var warning = warningCell.append("p");
    
 //     warningCell.attr("class", "alert-error");
  //    warning.text("Invalid barcode entered");
   //   }

    this.tree = [barcodeCell, entryCell];
  };

  ScanBarcodeView.prototype.attach = function() {
//    if(this.placeholderSelector) {
//      this.placeholderSelector().append(this.tree);
//    }
    $("#pending").append(this.tree[0].html());
    $("#pending").append(this.tree[1].html());
  };

  ScanBarcodeView.prototype.clear = function() {
    /* clear the view from the current page
     */
    var children = this.selection.selectAll("td");
    children.remove();
  };

  return ScanBarcodeView;

});
