define([ 'controllers/base_controller'
  , 'models/selection_page_model'
  , 'text!html_partials/_selection_page.html'
  , 'lib/pubsub'
  , 'lib/promise_tracker'
], function(BaseController, Model, selectionPagePartialHtml, PubSub, PromiseTracker) {
  'use strict';

  var PageController = Object.create(BaseController);

  $.extend(PageController, {
    register:function (callback) {
      callback('selection_page_controller', function (owner, factory, initData) {
        return Object.create(PageController).init(owner, factory, initData);
      });
    },

    init: function (owner, controllerFactory, workflowConfig) {
      this.controllerFactory = controllerFactory;
      this.notBatched = workflowConfig.output[0].not_batched;
      this.model = Object.create(Model).init(this, workflowConfig);
      this.owner = owner;
      return this;
    },

    setupController: function (setupData, jquerySelection) {
      var controller = this;
      this.jquerySelection = jquerySelection;
      this.model
          .then(function (model) {
            return model.setup(setupData);
          })
          .then(function (model) {
            return controller.setupSubControllers();
          }).then(function(){
            return controller.renderView();
          });
      return this;
    },

    makeBatchHandler: function() {
      var controller = this;
      if (controller.notBatched) {
        return function (e) {
          controller.model
            .then(function (model) {
              return model.changeRoleWithoutChangingBatch();
            })
            .fail(function (error) {
              PubSub.publish("error.status.s2", controller, error);
            })
            .then(function (model) {
              controller.owner.childDone(controller, "done", {batch:null,labware:null});
            });
        };
      } else {
        return function (e) {
          if (!controller.batchCreated) {
            controller.batchCreated = true;
            controller.jquerySelection().find("button.btn").attr("disabled", "disabled");
            controller.model
              .then(function (model) {
                return model.makeBatch();
              })
              .fail(function (error) {
                PubSub.publish("error.status.s2", controller, error);
              })
              .then(function (model) {
                controller.owner.childDone(controller, "done", {batch: model.batch});
              });
          }
        };
      }
    },

    renderView:function () {
      var template = _.template(selectionPagePartialHtml);
      var thisController = this;
      var thisModel;
      return this.model
          .then(function (model) {
            thisModel = model;
            thisController.jquerySelection().html(template(thisModel));
            thisController.jquerySelection().find("button.btn").on("click", thisController.makeBatchHandler());
            // render subviews...
            _.each(thisController.controllers, function (controller) {
              controller.renderView();
            });
            return thisModel.inputs;
          })
          .then(function (inputs) {
            var numTubes = inputs.length;
            if (numTubes < thisModel.capacity) {
              thisController.controllers[inputs.length].barcodeFocus();
            }
          });
    },

    setupSubControllers:function () {
      var controller = this;
      var thisModel;
      this.controllers = [];

      return controller.model
          .then(function (model) {
            thisModel = model;
            _(thisModel.capacity).times(function () {
              var subController = controller.controllerFactory.create('labware_controller', controller);
              controller.controllers.push(subController);
            });
            return thisModel.inputs;
          })
          .then(function(inputs){
            var numTubes = inputs.length;

            var jQueryForNthChild = function (childIndex) {
              return function () {
                return controller.jquerySelection().find(".labware-selection > li:eq(" + childIndex + ")");
              };
            };
            var controllerData = [];
            _.each(inputs, function (tube) {
              controllerData.push({
                resource:tube,
                expected_type:thisModel.config.input.model.singularize(),
                display_remove:true,
                display_barcode:false,
                title: thisModel.config.input.title
              });
            });
            var nbNoneLabwareRows = thisModel.capacity - (numTubes);
            if (nbNoneLabwareRows > 0 ) {
              controllerData.push({
                expected_type:thisModel.config.input.model.singularize(),
                display_remove:false,
                display_barcode:true,
                display_labware:false,
                title: thisModel.config.input.title
              });
              _(nbNoneLabwareRows-1).times(function () {
                controllerData.push({
                  display_remove:false,
                  display_barcode:false,
                  display_labware:false,
                  title: thisModel.config.input.title
                });
              });
            }

            _.chain(controller.controllers).zip(controllerData).each(function (pair, index) {
              var controller = pair[0], config = pair[1];
              controller.setupController(config, jQueryForNthChild(index));
            }).value();

          });
    },

    release:function () {
      this.jquerySelection().empty().off();
      return this;
    },

    childDone:function (child, action, data) {
      var controller = this;
      // model should not talk using 'childDone' anymore
      if (action === "barcodeScanned") {
        child.barcodeInputController.showProgress();

        PromiseTracker(this.model, {number_of_thens: 1})
          .afterThen(function(tracking){
            child.barcodeInputController.updateProgress(tracking.thens_called_pc());
          })
          .then(function (model) {
            return model.addTubeFromBarcode(data.BC);
          })
          .fail(function (error) {
            PubSub.publish("error.status.s2", controller, error);
            child.barcodeInputController.hideProgress();
          })
          .then(function () {
            controller.setupSubControllers();
            controller.renderView();
          });
      } else if (action === "removeLabware") {
        this.model
        .then(function (model) {
          return model.removeTubeByUuid(data.resource.uuid);
        })
        .then(function () {
          controller.setupSubControllers();
          controller.renderView();
        });
      }
    }
  });

  return PageController;
});
