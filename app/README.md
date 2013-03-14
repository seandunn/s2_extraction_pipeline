Presenters
===============

The S2 Extraction pipeline follows a standard Model-View-Presenter style architecture.

- Models speak to S2 via the S2 Mapper
- Views are interfaces that display the data via html
- Presenters read the information from the model, and creates the view.

The presenters may have different levels of responsibility, from page presenters presenting an entire page, to barcode presenters
responsible only for a barcode scanner component on the page.

As such, it is important to be able to exchange information between the classes. This is typically done using the childDone method
that all such classes have. Data is passed as JSON.

Constructing and setting up a presenter
-----------------------------------------

Constructors take on two parameters, these being an owner (which presenter is responsible for it) a presenter factory (such 
that presenters can be constructed on demand).

In order to set up a presenter, there are two parameters needed. A presenter needs an input model (JSON) and a JQuery selection.
The JQuery selection is the part of the page that the presenter will populate, through construction of a view and sub-presenters
(if it has any sub-presenters).
 

childDone
-----------------

All presenters have a childDone method which takes on a parent/child presenter (which is generally the presenter that calls the method)
, an action (a string to decide what to do in a particular case), and data (information that gets passed up/ down in
JSON form).
 
An example childDone method looks like the following:

	
	ScanBarcodePresenter.prototype.childDone = function (presenter, action, data) {

      if (action == "barcodeScanned") {
        this.handleBarcode(data);
      } else if (action === "parentError") {
        this.model.customError = (data && data.message) ? data.message : "Unknown error";
        this.model.busy = false;
        this.model.barcode = "";
        this.renderView();
      }
    };
    
If this is called by its view, the action barcodeScanned will be given. This gives the instruction for the presenter to 
handle the barcode that should be contained within the data. The below function shows what happens next:

    ScanBarcodePresenter.prototype.handleBarcode = function (barcode) {
      this.model.barcode = barcode;
      var dataForBarcodeScanned = {
        BC:barcode
      };
      this.owner.childDone(this, "barcodeScanned", dataForBarcodeScanned);
    };

Here, a tube is added. Then, childDone of the owner is then called such that it knows that a tube has been added, and what the
barcode of that tube is.

A typical chain may be as follows:

1) Page presenter:
2) Labware presenter:
3) Tube presenter:

For example, when childDone is called in 3), a typical sequence of passing information may look like the following:
3->2->1 (but never directly to 3)). When childDone is called in 3), this information must work its way up the chain. 1) has no knowledge of 3), so
all commands are passed through 2).
