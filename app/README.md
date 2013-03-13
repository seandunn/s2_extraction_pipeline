Presenters
===============

The S2 Extraction pipeline follows a standard Model-View- Presenter style architecture.

Models speak to S2 via the S2 Mapper
Views are interfaces that display the data via html
Presenters read the information from the model, and creates the view.


Chain of command

The presenters may have different levels of responsibility, from page presenters presenting an entire page, to barcode presenters
responsible only for a barcode scanner component on the page.

All presenters have a childDone method which takes on a child (which is whatever part of the code will need the data),
an action (a string to decide what to do in a particular case), and data (information to get passed up/ down in json form).
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

For example, when childDone is called in 3), a typical sequencing of information may look like the following:
3->2->1->2->3. 

When childDone is called in 3) for example, this information must work its way up the chain. 1) has no knowledge of 3), so
all commands are passed up through 2).



Creating a presenter according to our design specification

Functions needed will be:

create/update model
