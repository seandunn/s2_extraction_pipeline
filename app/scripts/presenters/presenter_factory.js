define([
  'labware/presenters/tube_presenter',
  'labware/presenters/spin_column_presenter',
  'labware/presenters/waste_tube_presenter',
  'labware/presenters/rack_presenter',
  'labware/presenters/gel_presenter',
  'labware/presenters/plate_presenter',

  // Add new presenters after this point for automatic registration

  // The top level presenters (typically these get re-used)
  'extraction_pipeline/presenters/row_presenter',
  'extraction_pipeline/presenters/step_presenter',
  'extraction_pipeline/presenters/scan_barcode_presenter',
  'extraction_pipeline/presenters/labware_presenter',
  'extraction_pipeline/presenters/connected_presenter',

  // Presenters that add extra behaviour, for some reason
  'extraction_pipeline/presenters/kit_presenter',
  'extraction_pipeline/presenters/rack_scan_presenter',
  'extraction_pipeline/presenters/selection_page_presenter',
  'extraction_pipeline/default/default_presenter',
  'extraction_pipeline/presenters/volume_control_presenter'
], function(TubePresenter, SpinColumnPresenter, WasteTubePresenter, RackPresenter, GelPresenter, PlatePresenter) {
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

  PresenterFactory.prototype.presenters = _.chain(arguments).drop(6).reduce(function(presenters, presenter) {
    presenter.register(function(name, method) { presenters[name] = method; });
    return presenters;
  }, {
    createSpinColumnPresenter: function(owner) { return new SpinColumnPresenter(owner, this); },
    createTubePresenter:       function(owner) { return new TubePresenter(owner, this); },
    createWasteTubePresenter:  function(owner) { return new WasteTubePresenter(owner, this); },
    createGelPresenter:        function(owner) { return new GelPresenter(owner, this); },
    createRackPresenter:       function(owner) { return new RackPresenter(owner, this); },
    createPlatePresenter:      function(owner) { return new PlatePresenter(owner, this); }
  }).value();

  // Function can take variable number of parameters, passing them onto the constructor function
  // for the named presenter.  It is here to ensure that the first two arguments are always the
  // owner and the factory with which the presenter was registered.
  PresenterFactory.prototype.create = function(name, owner) {
    var constructor = this.presenters[name] || this.presenters.default;
    return $.extend(
      _.partial(constructor, owner, this).apply(null, _.chain(arguments).drop(2).value()),
      { presenter_type_name_debug: name }
    );
  };

  PresenterFactory.prototype.createLabwareSubPresenter = function(owner, type) {
    switch (type) {
      case 'tube':        return this.presenters.createTubePresenter(owner);       break;
      case 'spin_column': return this.presenters.createSpinColumnPresenter(owner); break;
      case 'waste_tube':  return this.presenters.createWasteTubePresenter(owner);  break;
      case 'tube_rack':   return this.presenters.createRackPresenter(owner);       break;
      case 'gel':         return this.presenters.createGelPresenter(owner);        break;
      case 'plate':       return this.presenters.createPlatePresenter(owner);      break;
      default:            debugger;
    }
  };

  return PresenterFactory;
});
