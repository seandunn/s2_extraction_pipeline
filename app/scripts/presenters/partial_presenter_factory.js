define(['presenters/scan_barcode_presenter'], function(ScanBarcodePresenter) {
  'use strict';

  var PartialPresenterFactory = function() {
    /* Construct an instance of PartialPresenterFactory
     *
     * This is an implementation of the AbstractFactory pattern. The 
     * intention of using the pattern is to allow presenters that create
     * partial presenters to have a mock implementation in the testing. Otherwise
     * views are likely to be created in the testing, which will likely mess about
     * with the Jasmine testing library. 
     */
    return this;
    }

  PartialPresenterFactory.prototype.createScanBarcodePresenter =
    function (owner, selection, type) {
      var presenter = new ScanBarcodePresenter(owner, type);
      presenter.init(selection);
      return presenter;
    }

  return PartialPresenterFactory;
});
