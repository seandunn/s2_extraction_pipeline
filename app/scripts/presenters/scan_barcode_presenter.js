define(['models/scan_barcode_model', 'views/scan_barcode_view'], function(ScanBarcodeModel, ScanBarcodeView) {

  var ScanBarcodePresenter = function(owner) {
    this.owner = owner;
    this.view = undefined;
    this.model = undefined;
    }

  ScanBarcodePresenter.prototype.setModel = function(barcodeType) {
    this.model = new ScanBarcodeModel(barcodeType);
  }

  ScanBarcodePresenter.prototype.setupView = function(selection) {
    this.view = new ScanBarcodeView(this, selection);
    }

  ScanBarcodePresenter.prototype.render = function() {
    if (this.view) {
      this.view.generateTree(this.model);
      this.view.attach();
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
      this.render();
      var resource = this.model.getResourceFromBarcode();
      var presenter = this;
      resource.done(function(s2resource) { 
	presenter.owner.childDone(presenter, "barcodeScanned", s2resource);
	}).
	fail(function() {
	  presenter.model.busy = false;
	  presenter.render();
	  });
    }
    else {
      this.render();
    }
  }

  ScanBarcodePresenter.prototype.validateBarcode = function(barcode) {
    return false;
  }

  return ScanBarcodePresenter;

});
