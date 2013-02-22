define(['models/scan_barcode_model', 'views/scan_barcode_view'], function(ScanBarcodeModel, ScanBarcodeView) {

  var ScanBarcodePresenter = function(owner, barcodeType) {
    this.owner = owner;
    this.view = undefined;
    this.model = new ScanBarcodeModel(barcodeType);
    }

  ScanBarcodePresenter.prototype.init = function(selection) {
    this.view = new ScanBarcodeView(this, selection);
    }

  ScanBarcodePresenter.prototype.update = function() {
    if (this.view) {
      this.view.clear();
      this.view.render(this.model);
      }
    }

  ScanBarcodePresenter.prototype.release = function() {
    if(this.view) {
      this.view.clear();
      }
    }

  ScanBarcodePresenter.prototype.childDone = function(presenter, action, data) {
    if (action == "barcodeScanned") {
      this.handleBarcode(data);
      }
    }

  ScanBarcodePresenter.prototype.handleBarcode = function(barcode) {
    this.model.barcode = barcode;
    if(this.model.isValid()) {
      this.model.busy = true;
      this.update();
      var resource = this.model.getResourceFromBarcode();
      var presenter = this;
      resource.done(function(s2tube) { 
	presenter.owner.childDone(presenter, "barcodeScanned", s2tube);
	}).
	fail(function() {
	  presenter.model.busy = false;
	  presenter.update();
	  });
    }
    else {
      this.update();
    }
  }

  ScanBarcodePresenter.prototype.validateBarcode = function(barcode) {
    return false;
  }

  return ScanBarcodePresenter;

});
