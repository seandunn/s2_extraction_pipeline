Controllers
===============

The S2 Extraction pipeline follows a standard Model-View-Controller style architecture. It should be noted that:

- Models speak to S2 via the S2 Mapper
- Controllers read the information from the model, and create the view (and sub controllers if it has any)

The controllers in this component own their respective models and views.

The controllers may have different levels of responsibility, from page controllers presenting an entire page, to barcode controllers
responsible only for a barcode scanner component on the page. By convention, page controllers are suffixed with _page_controller to avoid any confusion,
for example, binding_complete_page_controller.

Since controllers have differing levels of responsibility, it is important to be able to pass information up and down the hierarchy. 
This is typically done using the childDone method
that all such classes have. Data is passed as JSON through this method. The idea of the childDone method is to simulate a callback.
In a later refactor, all childDone methods should be changed into callbacks.

Constructing and setting up a controller
-----------------------------------------

Constructors take on two parameters, these being an owner (which controller is responsible for it) a controller factory. The controller
factory is passed as a dependency injection, and is done to facilitate unit testing.

In order to set up a controller, there are two parameters needed. A controller needs an input model (JSON) and a JQuery selection.
The JQuery selection is the placeholder that the controller will populate, through construction of a view and sub-controllers
(if it has any sub-controllers). An example JQuery selection is shown below:

    this.jquerySelection = function () {
      return $('#content');
    };
 

childDone
-----------------

All controllers have a childDone method which takes on a parent/child controller (who finishes)
, an action (what has been done), and data (what information is relevant in JSON).
 
An example childDone method looks like the following:

	
	ScanBarcodeController.prototype.childDone = function (child, action, data) {
	  if (child === this.currentView){
        if (action == "barcodeScanned") {
          this.handleBarcode(data);
          return;
        }
      }
      else if (child === this.model) {
        if (action == "modelUpdated") {
          this.renderView();
          this.owner.childDone(this, "foundNewBarcode", dataForOwner);
	 	  return;
        }
      }
    };
    
If this is called by its view, the action barcodeScanned will be given. This gives the instruction for the controller to 
handle the barcode that should be contained within the data. The below function shows what happens next:

    ScanBarcodeController.prototype.handleBarcode = function (barcode) {
      this.model.addBarcode(barcode);
    }
    
    /// in the model
    
    ScanBarcodeModel.prototype.addBarcode = function(barcode) {
    	// do stuff
    	// if ok then
      this.owner.childDone(this, "modelUpdated", someData);  	
    };

Here, a tube is added. Then, childDone of the owner is then called such that it knows that a tube has been added, and what the
barcode of that tube is. As can be seen, we get multiple calls, and this is not the most efficient way of doing this. This 
will be optimised when there is a fully functional framework in place.

A typical chain may be as follows:

- 1) Page controller
- 2) Labware controller
- 3) Tube controller

For example, when childDone is called in 3), a typical sequence of passing information may look like the following:
3->2->1 (but never directly to 3)). When childDone is called in 3), this information must work its way up the chain. 1) has no knowledge of 3), so
all commands are passed through 2).


Events
===============

busyBox
-----------------

To mark a DOM element as 'busy', make it trigger an event of this form:

    $(source).trigger('s2.busybox.start_process');

To unmark a div element as 'busy', make it trigger an event of this form:

    $(source).trigger('s2.busybox.end_process');

It is also possible to use the following form:

    $(source).trigger('s2.busybox.process_in_progress', bool);

where bool indicates whether the source element is busy or not.

