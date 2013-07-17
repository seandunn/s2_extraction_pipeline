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
      this.notBatched = workflowConfig.output[0].not_batched;
      this.model = Object.create(Model).init(this, workflowConfig);
      this.owner = owner;
      return this;
    },
    setupPresenter: function (setupData, jquerySelection) {
      var presenter = this;
      this.jquerySelection = jquerySelection;
      this.model
          .then(function (model) {
            return model.setup(setupData);
          })
          .then(function (model) {
            return presenter.setupSubPresenters();
          }).then(function(){
            return presenter.renderView();
          });
      return this;
    },

    makeBatchHandler: function() {
      var presenter = this;
      if (presenter.notBatched) {
        return function (e) {
          presenter.model
            .then(function (model) {
              return model.changeRoleWithoutChangingBatch();
            })
            .fail(function (error) {
              PubSub.publish('s2.status.error', presenter, error);
            })
            .then(function (model) {
              presenter.owner.childDone(presenter, "done", {batch:null,labware:null});
            });
        }
      } else {
        return function (e) {
          if (!presenter.batchCreated) {
            presenter.batchCreated = true;
            presenter.jquerySelection().find("button.btn").attr("disabled", "disabled");
            presenter.model
              .then(function (model) {
                return model.makeBatch()
              })
              .fail(function (error) {
                PubSub.publish('s2.status.error', presenter, error);
              })
              .then(function (model) {
                presenter.owner.childDone(presenter, "done", {batch: model.batch});
              });
          }
        }
      }
    },

    renderView:function () {
      var template = _.template(selectionPagePartialHtml);
      var thisPresenter = this;
      return this.model
          .then(function (model) {
            thisPresenter.jquerySelection().html(template(model));
            thisPresenter.jquerySelection().find("button.btn").on("click", thisPresenter.makeBatchHandler());
            // render subviews...
            _.each(thisPresenter.presenters, function (presenter) {
              presenter.renderView();
            });
            return model.inputs;
          })
          .then(function (inputs) {
            var numTubes = inputs.length;

            thisPresenter.presenters[inputs.length].barcodeFocus();
          });
    },

    setupSubPresenters:function () {
      var presenter = this;
      var thisModel;
      this.presenters = [];

      return presenter.model
          .then(function (model) {
            thisModel = model;
            _(thisModel.capacity).times(function () {
              var subPresenter = presenter.presenterFactory.create('labware_presenter', presenter);
              presenter.presenters.push(subPresenter);
            });
            return thisModel.inputs;
          })
          .then(function(inputs){
            var numTubes = inputs.length;

            var jQueryForNthChild = function (childIndex) {
              return function () {
                return presenter.jquerySelection().find("li :eq(" + childIndex + ")");
              };
            };
            var presenterData = [];
            _.each(inputs, function (tube) {
              presenterData.push({
                resource:tube,
                expected_type:thisModel.config.input.model.singularize(),
                display_remove:true,
                display_barcode:false,
                title: thisModel.config.input.title
              });
            });

            presenterData.push({
              expected_type:thisModel.config.input.model.singularize(),
              display_remove:false,
              display_barcode:true,
              display_labware:false,
              title: thisModel.config.input.title
            });

            // numTubes + 1 to account for the intermediate barcode scan row
            _(thisModel.capacity - (numTubes + 1)).times(function () {
              presenterData.push({
                display_remove:false,
                display_barcode:false,
                display_labware:false,
                title: thisModel.config.input.title
              });
            });

            _.chain(presenter.presenters).zip(presenterData).each(function (pair, index) {
              var presenter = pair[0], config = pair[1];
              presenter.setupPresenter(config, jQueryForNthChild(index));
            }).value();

          })
    },

    release:function () {
      this.jquerySelection().empty().off();
      return this;
    },

    childDone:function (child, action, data) {
      var presenter = this;
      if (child === this.model) {
        // model should not talk using 'childDone' anymore
      } else {
        if (action === "barcodeScanned") {
          this.model
              .then(function (model) {
                return model.addTubeFromBarcode(data.BC);
              })
              .fail(function (error) {
                PubSub.publish('s2.status.error', presenter, error);
              })
              .then(function () {
                presenter.setupSubPresenters();
                presenter.renderView();
              });
        } else if (action === "removeLabware") {
          this.model
              .then(function (model) {
                return model.removeTubeByUuid(data.resource.uuid);
              })
              .then(function () {
                presenter.setupSubPresenters();
                presenter.renderView();
              })
        }
      }
    }
  });

  return PagePresenter;
});

