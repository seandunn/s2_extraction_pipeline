define(['extraction_pipeline/presenters/scan_barcode_presenter',
  'extraction_pipeline/presenters/selection_page_presenter',
  'extraction_pipeline/default/default_presenter',
  'extraction_pipeline/presenters/kit_presenter',
  'extraction_pipeline/presenters/row_presenter',
  'extraction_pipeline/presenters/labware_presenter',
  'extraction_pipeline/presenters/binding_complete_page_presenter',
  'extraction_pipeline/presenters/binding_finished_page_presenter',
  'extraction_pipeline/presenters/elusion_loading_page_presenter',
  'extraction_pipeline/presenters/elusion_wash_page_presenter',
  'labware/presenters/tube_presenter',
  'labware/presenters/spin_column_presenter',
  'labware/presenters/waste_tube_presenter'],
    function (ScanBarcodePresenter,
              SelectionPagePresenter,
              DefaultPresenter,
              KitPresenter,
              RowPresenter,
              LabwarePresenter,
              BindingCompletePagePresenter,
              BindingFinishedPagePresenter,
              ElusionLoadingPagePresenter,
              ElusionWashPagePresenter,
              TubePresenter,
              SpinColumnPresenter,
              WasteTubePresenter) {
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
      };

      PresenterFactory.prototype.createScanBarcodePresenter =
          function (owner) {
            return new ScanBarcodePresenter(owner, this);
          };

      PresenterFactory.prototype.createSelectionPagePresenter =
          function (owner) {
            return Object.create(SelectionPagePresenter).init(owner, this);
          };

      PresenterFactory.prototype.createDefaultPresenter =
          function (owner) {
            return Object.create(DefaultPresenter).init(owner, this);
          };

      PresenterFactory.prototype.createKitPresenter =
          function (owner) {
            return Object.create(KitPresenter).init(owner, this);
          };

      PresenterFactory.prototype.createRowPresenter =
          function (owner) {
            return Object.create(RowPresenter).init(owner, this);
          };

      PresenterFactory.prototype.createSpinColumnPresenter =
          function (owner) {
            return new SpinColumnPresenter(owner, this);
          };

      PresenterFactory.prototype.createTubePresenter =
          function (owner) {
            return new TubePresenter(owner, this);
          };

      PresenterFactory.prototype.createLabwarePresenter =
          function (owner) {
            return Object.create(LabwarePresenter).init(owner, this);
          };

      PresenterFactory.prototype.createBindingCompletePage =
          function (owner) {
            return Object.create(BindingCompletePagePresenter).init(owner, this);
          };

      PresenterFactory.prototype.createBindingFinishedPage =
        function (owner) {
          return new BindingFinishedPagePresenter(owner, this);
        };

      PresenterFactory.prototype.createElusionLoadingPage =
        function (owner) {
          return new ElusionLoadingPagePresenter(owner, this);
        };

      PresenterFactory.prototype.createElusionWashPage =
        function (owner) {
          return new ElusionWashPagePresenter(owner, this);
        };

      PresenterFactory.prototype.createLabwareSubPresenter =
          function (owner, type) {
            var presenter = null;
            switch (type) {
              case 'tube':
                presenter = new TubePresenter(owner, this);
                break;
              case 'spin_columns':
                presenter = new SpinColumnPresenter(owner, this);
                break;
              case 'waste_tube':
                presenter = new WasteTubePresenter(owner, this);
                break;
              default :
                debugger;
            }
            return presenter;
          };

      return PresenterFactory;
    });
