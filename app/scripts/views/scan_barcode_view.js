define(['text!extraction_pipeline/html_partials/scan_barcode_partial.html'], function (scanBarcodePartialHtml) {
  'use strict';

  var ScanBarcodeView = function (owner, jquerySelector) {
    /* Constructs an instance of ScanBarCode view
     *
     * Arguments
     * ---------
     * owner : the presenter that owns this view
     * selection : the selection point to operate on
     */
    this.owner = owner;

    return this;
  };

  ScanBarcodeView.prototype.render = function(model) {
    this.model = model;

    var partial = $(_.template(scanBarcodePartialHtml)(model));

    return this.bindEvents(partial);

  };


  ScanBarcodeView.prototype.bindEvents = function (element) {
    var view = this;

    return element.on("keypress", "input", function (e) {
      if (e.which === 13) {
        view.model.barcode = e.currentTarget.value;

        $(e.currentTarget).trigger('s2.barcode.scanned', e.currentTarget.value );
        view.owner.childDone(this, "barcodeScanned", view.model);

        // e.currentTarget.closest('.alert-error').css('display', 'none');
      }
    });

  };


  return ScanBarcodeView;

});
