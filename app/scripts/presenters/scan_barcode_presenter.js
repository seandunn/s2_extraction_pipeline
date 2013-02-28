define(['extraction_pipeline/models/scan_barcode_model', 'extraction_pipeline/views/scan_barcode_view'], function(ScanBarcodeModel, ScanBarcodeView) {

  var ScanBarcodePresenter = function (owner, presenterFactory, type) {
    console.log("ScanBarcodePresenter constructor : ", type);
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    this.view = undefined;
    this.model = undefined;
    this.type = type;
    return this;
  };

  ScanBarcodePresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    console.log("ScanBarcodePresenter  : setupPresenter");
    this.setupPlaceholder(jquerySelection);

    this.updateModel(input_model); // we do it before the setup view, because we know everything... no need for a tmp view
    this.setupView();
    this.renderView();
    return this;
  };

  ScanBarcodePresenter.prototype.setupPlaceholder = function (jquerySelection) {
    console.log("ScanBarcodePresenter  : setupPlaceholder");
    this.jquerySelection = jquerySelection;
    return this;
  };


  ScanBarcodePresenter.prototype.updateModel = function (input_model) {
    console.log("ScanBarcodePresenter  : updateModel", this.type);
    if (!this.model) {
      this.model = new ScanBarcodeModel(this.type);
    }
//    var theURL = "http://localhost:8088/tube/2_"+input_model.v;
//    var that = this;
//    $.ajax({url:theURL, type:"GET"}).complete(
//        function (data) {
//          that.model = $.parseJSON(data.responseText);
//          that.setupView();
//          that.renderView();
//          that.setupSubPresenters();
//        }
//    );
    return this;
  };

  ScanBarcodePresenter.prototype.setupSubPresenters = function () {
    // check with this.model for the needed subpresenters...
    console.log("ScanBarcodePresenter  : setupSubPresenter : none");
    return this;
  };

  ScanBarcodePresenter.prototype.setupSubModel = function (model, jquerySelection) {
    console.log("ScanBarcodePresenter  : setupSubModel : none");
    return this;
  };

  ScanBarcodePresenter.prototype.setupView = function () {
    this.view = new ScanBarcodeView(this, this.jquerySelection);
  }

  ScanBarcodePresenter.prototype.renderView = function () {
    if (this.view) {
      this.view.render(this.model);
    }
  };

  ScanBarcodePresenter.prototype.release = function () {
    if (this.view) {
      this.view.clear();
    }
  }

  ScanBarcodePresenter.prototype.childDone = function (presenter, action, data) {
    if (action == "barcodeScanned") {
      this.handleBarcode(data);
    }
  }

  ScanBarcodePresenter.prototype.handleBarcode = function (barcode) {
    this.model.barcode = barcode;
    if (this.model.isValid()) {
      this.model.busy = true;
      this.renderView();
      var resource = this.model.getResourceFromBarcode();
      var presenter = this;
      resource
          .done(function (s2resource) {
            presenter.owner.childDone(presenter, "barcodeScanned", s2resource);
          })
          .fail(function () {
            presenter.model.busy = false;
            presenter.render();
          });
    }
    else {
      this.renderView();
    }
  }

  ScanBarcodePresenter.prototype.validateBarcode = function (barcode) {
    return false;
  }

  return ScanBarcodePresenter;

});
