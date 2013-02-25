define(['presenters/scan_barcode_presenter','presenters/selection_page_presenter'], function(ScanBarcodePresenter, SelectionPagePresenter) {
  'use strict';

  var PresenterFactory = function() {
    /* Construct an instance of PresenterFactory
     *
     * This is an implementation of the AbstractFactory pattern. The 
     * intention of using the pattern is to allow presenters that create
     * partial presenters to have a mock implementation in the testing. Otherwise
     * views are likely to be created in the testing, which will likely mess about
     * with the Jasmine testing library. 
     */
    return this;
    }

  PresenterFactory.prototype.createScanBarcodePresenter =
    function (owner, selection, type) {
      var presenter = new ScanBarcodePresenter(owner);
      presenter.setModel(type);
      presenter.setupView(selection);
      
      return presenter;
    }

  return PresenterFactory;
});
