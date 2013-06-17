define([ 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/selection_page_model'
  , 'text!extraction_pipeline/html_partials/selection_page_partial.html'
  , 'extraction_pipeline/lib/pubsub'
], function(BasePresenter, Model, selectionPagePartialHtml, PubSub) {
  'use strict';

  var PagePresenter = Object.create(BasePresenter);

  $.extend(PagePresenter, {
    register:function (callback) {
      callback('selection_page_presenter', function (owner, factory, initData) {
        return Object.create(PagePresenter).init(owner, factory, initData);
      });
    },

    init: function (owner, presenterFactory, workflowConfig) {
      this.presenterFactory = presenterFactory;
      this.model = Object.create(Model).init(this, workflowConfig);
      this.owner = owner;
      return this;
    },
    setupPresenter: function (setupData, jquerySelection) {
      var presenter = this;
      this.jquerySelection = jquerySelection;
      this.model.setup(setupData).then(function(){
        presenter.setupSubPresenters();
        presenter.renderView();
      });
      return this;
    },

    makeBatchHandler: function() {
      var presenter = this;
      return function(e){
        presenter.model.makeBatch().then(function(batch){
          presenter.owner.childDone(presenter, "done", presenter.model);
        });
      }
    },

    renderView:function () {
      var template = _.template(selectionPagePartialHtml);

      this.jquerySelection().html(template(this.model));

      this.jquerySelection().find("button.btn").on("click", this.makeBatchHandler());

      // render subviews...
      _.each(this.presenters, function (presenter) {
        presenter.renderView();
      });

      this.presenters[this.model.tubes.length].barcodeFocus();
      return this;
    },

    setupSubPresenters:function () {
      var presenter = this;
      this.presenters = [];

      _(this.model.capacity).times(function () {
        var subPresenter = presenter.presenterFactory.create('labware_presenter', presenter);
        presenter.presenters.push(subPresenter);
      });

      var jQueryForNthChild = function (childIndex) {
        return function () {
          return presenter.jquerySelection().find("li :eq(" + childIndex + ")");
        };
      };

      var numTubes = this.model.tubes.length
      var presenterData = [];

      _.each(this.model.tubes, function (tube) {
        presenterData.push({
          resource:tube,
          expected_type:presenter.model.config.input.model.singularize(),
          display_remove:true,
          display_barcode:false,
          title: presenter.model.config.input.title
        });
      });

      presenterData.push({
        expected_type:presenter.model.config.input.model.singularize(),
        display_remove:false,
        display_barcode:true,
        display_labware:false,
        title: presenter.model.config.input.title
      });

      // numTubes + 1 to account for the intermediate barcode scan row
      _(this.model.capacity - (numTubes + 1)).times(function () {
        presenterData.push({
          display_remove:false,
          display_barcode:false,
          display_labware:false,
          title: presenter.model.config.input.title
        });
      });

      _.chain(this.presenters).zip(presenterData).each(function (pair, index) {
        var presenter = pair[0], config = pair[1];
        presenter.setupPresenter(config, jQueryForNthChild(index));
      }).value();
    },

    release:function () {
      this.jquerySelection().empty().off();
      return this;
    },

    childDone:function (child, action, data) {
      var presenter = this;
      if (child === this.model) {
        if (action === "batchSaved") {
          this.owner.childDone(this, "done", this.model);
        }
      } else {
        if (action === "barcodeScanned") {
          this.model.addTubeFromBarcode(data.BC)
            .done(function() {
              presenter.setupSubPresenters();
              presenter.renderView();
            })
            .fail(function(error) {
              PubSub.publish('s2.status.error', presenter, error);
            });
        } else if (action === "removeLabware") {
          this.model.removeTubeByUuid(data.resource.uuid);
          this.setupSubPresenters();
          this.renderView();
        }
      }
    }
  });

  return PagePresenter;
});

