define([
       'extraction_pipeline/presenters/base_presenter'
], function(BasePresenter) {
  return {
    extend: function(presenterName, presenterModel, presenterView) {
      var presenter = Object.create(BasePresenter);
      $.extend(presenter, {
        register:function (callback) {
          callback(presenterName, function (owner, factory, initData) {
            return Object.create(presenter).init(owner, factory, initData);
          });
        },

        init:function (owner, presenterFactory, initData) {
          this.config           = initData;
          this.owner            = owner;
          this.model            = Object.create(presenterModel).init(this, initData);
          this.rowPresenters    = [];
          this.presenterFactory = presenterFactory;
          return this;
        },

        setupPresenter:function (input_model, jquerySelection) {
          this.jquerySelection = jquerySelection;
          this.model.setBatch(input_model.batch);
          this.setupView();
          this.renderView();
          this.setupSubPresenters();
          return this;
        },
        setupSubPresenters: function() {
          this.model.setupInputPresenters();
          this.setupSubModel();
          return this;
        },
        setupSubModel:function () {
          return this;
        },

        setupView:function () {
          this.currentView = new presenterView(this, this.jquerySelection);
          return this;
        },
        release:function () {
          this.currentView.clear();
          return this;
        },
        renderView:function () {
          this.currentView.renderView();
          return this;
        },

        checkPageComplete:function () {
          return _.all(this.rowPresenters, function(presenter) {
            return presenter.isRowComplete();
          });
        },

        childDone:function (child, action, data) {
          if (child === this.currentView) {
            this.currentViewDone(child, action, data);
          } else if (child === this.model) {
            this.modelDone(child, action, data);
          } else {
            this.unknownDone(child, action, data);
          }
        },

        unknownDone: function(child, action, data) {
          if (action === "barcodeScanned") {
            var originator = data.origin;

            // HACK: Identify the input as the first labware presenter in the row
            switch(originator) {
            case child.labware1Presenter:
              if (originator.labwareModel.expected_type === this.config.input.model.singularize()) {
                this.model.getInputByBarcode(originator, data);
                this.inputDone(child, action, data);
              }
              break;

            case child.labware2Presenter:
            case child.labware3Presenter:
              if (this.config.output[originator.labwareModel.expected_type]) {
                this.model.getOutputByBarcode(originator, data);
                this.outputDone(child, action, data);
              }
              break;
            }
          } else if (action === 'completed') {
            this.rowDone(child, action, data);
          }
        },
        inputDone: function(child, action, data) {
        },
        outputDone: function(child, action, data) {
        },

      });
      return presenter;
    }
  };
});
