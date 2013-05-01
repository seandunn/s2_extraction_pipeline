define([
       'text!extraction_pipeline/html_partials/scan_barcode_partial.html'
], function (scanBarcodePartialHtml) {
  'use strict';

  var ScanBarcodePresenter = function (owner, presenterFactory) {
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    return this;
  };

  ScanBarcodePresenter.prototype.setupPresenter = function (inputModel, jquerySelection) {
    this.jquerySelection = jquerySelection;

    this.model = inputModel;
    return this;
  };

  ScanBarcodePresenter.prototype.renderView = function () {
    var partial = $(_.template(scanBarcodePartialHtml)(this.model));

    return this.jquerySelection().append(this.bindEvents(partial));
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

  ScanBarcodePresenter.prototype.childDone = function (presenter, action, model) {
    if (action === "parentError") {
      this.model.customError = (model && model.message) ? model.message : "Unknown error";
      this.model.busy = false;
      this.model.barcode = "";
    }
  };

  ScanBarcodePresenter.prototype.handleBarcode = function (model) {
    this.model = model
  };

  ScanBarcodePresenter.prototype.displayErrorMessage = function (message) {
    var selection = this.jquerySelector().find('.alert-error');
    var text = 'Error!';

    if (message) {
      text += message;
    }

    var tmp = $('<h4/>', {
      class:'alert-heading',
      text:text
    });

    tmp.appendTo(selection.empty());
    selection.css('display', 'block');
  };

  ScanBarcodePresenter.prototype.isValid = function () {
    return true; // replaces model method that always returns true.
  };

  ScanBarcodePresenter.prototype.focus = function () {
    this.jquerySelection().find('input').focus();
  };

  ScanBarcodePresenter.prototype.enable = function () {
    this.jquerySelection().find(".barcodeInput").removeAttr('disabled', 'disabled');
  };

  ScanBarcodePresenter.prototype.disable = function () {
    this.jquerySelection().find(".barcodeInput").attr('disabled', 'disabled');
  };


  return {
    register:function (callback) {
      callback('scan_barcode_presenter', function (owner, factory) {
        return new ScanBarcodePresenter(owner, factory);
      });
    }
  };
});
