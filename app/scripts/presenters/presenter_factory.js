define(['extraction_pipeline/presenters/scan_barcode_presenter',
	'extraction_pipeline/presenters/selection_page_presenter',
	'extraction_pipeline/presenters/tube_removal_presenter',
        'labware/presenters/tube_presenter'], 
       function(ScanBarcodePresenter,
		SelectionPagePresenter,
		TubeRemovalPresenter,
	        TubePresenter) {
  'use strict';

  var PresenterFactory = function () {
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
    function (owner, type) {
      return new ScanBarcodePresenter(owner, this, type);
    };

  PresenterFactory.prototype.createTubeRemovalPresenter = 
    function (owner) {
      return new TubeRemovalPresenter(owner, this);
      //presenter.setModel(tube);
//      return presenter;
    };

  PresenterFactory.prototype.createTubePresenter = 
    function (owner) {
      return new TubePresenter(owner, this);
//      presenter.setupModel(tube);
//      
//      return presenter;
    };
    

  return PresenterFactory;
});
