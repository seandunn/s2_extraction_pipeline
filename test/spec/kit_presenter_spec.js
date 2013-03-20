define(['presenters/kit_presenter'], function (KitPresenter) {
  'use strict';

  describe("KitPagePresenter", function () {

    var model = undefined;
    var presenter = undefined;
    var view = undefined;
    var app = undefined;
    var partialFactory = undefined;
    var mockPresenters = undefined;

    function configureSpyView() {
      view = {};

      view.clear = function () {
      };

      view.render = function (data) {
      };

      view.getKitTypeSelection = function() {
        return ["DNA"];
      };

      view.setKitValidState = function(valid) {

      };

      spyOn(view, 'clear');
      spyOn(view, 'render');
    }

    function configureSpyAppController() {
      app = {};
      app.childDone = function (presenter, action, data) {
      };

      app.tubeUUIDs =  [
    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"}
  ];

      spyOn(app, 'childDone');
    }

    function createMockPresenter(name) {
      var mockPresenter = { name:name};
      mockPresenter.setupPresenter = function (input_model, jquerySelection) {
      };
      mockPresenter.setupPlaceholder = function (jquerySelection) {
      };
      mockPresenter.updateModel = function (input_model) {
      };
      mockPresenter.setupSubModel = function (model, jquerySelection) {
      };
      mockPresenter.setupView = function () {
      };
      mockPresenter.renderView = function () {
      };
      mockPresenter.release = function () {
      };
      mockPresenter.childDone = function (presenter, action, data) {
      };

      spyOn(mockPresenter, 'setupPresenter');
      spyOn(mockPresenter, 'setupPlaceholder');
      spyOn(mockPresenter, 'setupSubModel');
      spyOn(mockPresenter, 'setupView');
      spyOn(mockPresenter, 'renderView');
      spyOn(mockPresenter, 'release');
      spyOn(mockPresenter, 'childDone');

      mockPresenters.push(mockPresenter);
      return mockPresenter;
    }

    function configureMockPartialFactory() {
      partialFactory = {};
      partialFactory.createPresenter = function (name, owner) {
        return createMockPresenter(name);
      };
      partialFactory.createScanBarcodePresenter = function (owner, type) {
        var presenter = this.createPresenter("scanBarcode", owner);
        presenter.setupPresenter(type);
        return presenter;
      };
      partialFactory.createRowPresenter = function (owner) {
        return this.createPresenter("row", owner);
      }
    }

    describe("Presenter instantiates", function () {
      beforeEach(function () {
        mockPresenters = [];
        configureSpyAppController();
        configureMockPartialFactory();
        presenter = Object.create(KitPresenter).init(app, partialFactory);
        configureSpyView();
        presenter.currentView = view;
      });
      it("Presenter is defined", function () {
        expect(presenter).toBeDefined();
      });
      it("Presenter contains a mock view", function () {
        expect(presenter.currentView).toBeDefined();
      });
    });
    describe("Presenter updates model", function () {
      beforeEach(function () {
        mockPresenters = [];
        configureSpyAppController();
        configureMockPartialFactory();
        presenter = Object.create(KitPresenter).init(app, partialFactory);
        configureSpyView();
        presenter.currentView = view;
        var dummyInput = {
          userUUID:"2345678901234",
          labwareUUID:"106d61c0-6224-0130-90b6-282066132de2",
          batchUUID:"1234567890"
        };
      });
      it("Model is defined", function () {
        expect(presenter.kitModel).toBeDefined();
      });
      it("Presenter has created rows", function () {
        expect(presenter.rowPresenters.length).not.toEqual(0);
      });
    });
    describe("Presenter validates kit", function () {
      beforeEach(function () {
        mockPresenters = [];
        configureSpyAppController();
        configureMockPartialFactory();
        presenter = Object.create(KitPresenter).init(app, partialFactory);
        configureSpyView();
        presenter.currentView = view;
        presenter.tubeTypes = ["DNA", "DNA"];
        var dummyInput = {
          userUUID:"2345678901234",
          labwareUUID:"106d61c0-6224-0130-90b6-282066132de2",
          batchUUID:"1234567890"
        };
        presenter.updateModel(dummyInput);
      });
      it("Presenter validates compatible kit correctly", function () {
        expect(presenter.validateKitTubes(["DNA"])).toBeTruthy();
      });
      it("Presenter validates incompatible kit correctly", function () {
        expect(presenter.validateKitTubes(["RNA"])).toBeFalsy();
      });
    });
  });
});
