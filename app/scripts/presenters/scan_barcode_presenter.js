define([
       'text!extraction_pipeline/html_partials/scan_barcode_partial.html'
], function (scanBarcodePartialHtml) {
  'use strict';

  var ScanBarcodePresenter = function (owner, presenterFactory) {
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    return this;
  };

  ScanBarcodePresenter.prototype.setupPresenter = function (inputModel) {
    this.model = inputModel;
    return this;
  };

  ScanBarcodePresenter.prototype.renderView = function () {
    var partial = $(_.template(scanBarcodePartialHtml)(this.model));

    return this.bindEvents(partial);
  };

  ScanBarcodePresenter.prototype.bindEvents = function (element) {
    var view = this

    return element.on("keypress", "input", function (e) {
      if (e.which === 13) {
        view.model.barcode = e.currentTarget.value;
        $(e.currentTarget).trigger('s2.barcode.scanned', e.currentTarget.value );
        view.owner.childDone(view, "barcodeScanned", view.model);

        // e.currentTarget.closest('.alert-error').css('display', 'none');
      }
    });
  };


  ScanBarcodePresenter.prototype.release = function() {};

  return {
    register:function (callback) {
      callback('scan_barcode_presenter', function (owner, factory) {
        return new ScanBarcodePresenter(owner, factory);
      });
    }
  };
});
