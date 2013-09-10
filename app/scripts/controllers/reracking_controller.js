define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/_reracking.html'
  , 'models/reracking_model'
  , 'lib/pubsub'
  , 'lib/util'
  , 'views/drop_zone'
], function (config, BaseController, componentPartialHtml, Model, PubSub, Util, DropZone) {
  'use strict';

  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register: function (callback) {
      callback('reracking_controller', function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.factory = factory;
      this.config = config;
      this.model = Object.create(Model).init(this, config);
      this.view = this.createHtml(
          {
            printerList: _.filter(config.printerList, function(printer){return printer.type === 1;})
          }
      );
      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function (templateData) {
      var thisController = this;
      var html = $(_.template(componentPartialHtml)(templateData));
      this.outputSelection = html.find('#output');
      this.accordionSelection = html.find('#accordion');
      this.rerackingBtnSelection = html.find('#rerack-btn');
      this.printRerackBtnSelection = html.find('#print-rerack-btn');
      this.startRerackingBtnSelection = html.find('#start-rerack-btn');
      this.outputrackSelection = html.find('.output-labware');
      this.rackListSelection = html.find('#rack-list');
      this.barcodeReaderSelection = html.find("#barcodeReader");
      var scanBarcodeController = this.factory.create('scan_barcode_controller', this).init({type: "labware"});
      this.barcodeReaderSelection.append(
          this.bindReturnKey(scanBarcodeController.renderView(),
              labwareCallback,
              barcodeErrorCallback('Barcode must be a 13 digit number.'),
              validation)
      );
      this.barcodeReaderSelection.show();
      this.enableDropzone(html);
      this.outputSelection.hide();
      this.startRerackingBtnSelection.hide();
      this.printRerackBtnSelection.hide();
      this.accordionSelection.find("h3:nth(1)").hide();
      this.accordionSelection.find("h3:nth(2)").hide();
      this.accordionSelection.accordion({
        collapsible: true,
        heightStyle: "content"
      });
      this.printRerackBtnSelection.click(onPrintRerackingEventHandler(thisController));
      this.rerackingBtnSelection.click(onRerackingEventHandler(thisController));
      this.startRerackingBtnSelection.click(onStartRerackingEventHandler(thisController));
      return html;

      function onPrintRerackingEventHandler(controller) {
        return function () {
          controller.onPrintBarcode();
        }
      }
      function onRerackingEventHandler(controller) {
        return function () {
          controller.onReracking();
        }
      }
      function onStartRerackingEventHandler(controller) {
        return function () {
          controller.onStartReracking();
        }
      }
      function barcodeErrorCallback(errorText) {
        var errorHtml = function (errorText) {
          return $("<h4/>", {class: "alert-heading", text: errorText});
        };
        return function (event, template, controller) {
          thisController.message('error', errorText);
          template
              .find('input')
              .val(''); // clear the input
        };
      }

      function labwareCallback(event, template, controller) {
        template.find('.alert-error').addClass('hide');
        thisController.labwareScannedHandler(Util.pad(event.currentTarget.value));
        thisController.barcodeReaderSelection.find('input').val(''); // clear the input
      }

      function validation(element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) return;
          if (event.currentTarget.value.length === 13) {
            callback(event, element, thisController);
          } else {
            errorCallback(event, element, thisController);
          }
        }
      }
    },

    subscribeToPubSubEvents: function () {
      var thisController = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
      function resetViewEventHandler(event, source, eventData) {
        thisController.reset();
      }
    },

    reset: function () {
      this.model.then(function (model) {
        model.reset();
      });
      this.accordionSelection.accordion("option","active", 0);
      this.rackListSelection.empty();
      this.startRerackingBtnSelection.hide();
      delete this.outputRackController;
      this.outputrackSelection.hide();
      this.outputSelection.hide();
      this.printRerackBtnSelection.hide();


      this.accordionSelection.find("h3:nth(1)").hide();
      this.accordionSelection.find("h3:nth(2)").hide();

//      this.generateManifestBtnSelection.show();
//      this.downloadManifestBtnSelection.hide();
//      this.printBoxSelection.hide();
//      this.enableSampleGeneration();
      this.message();
    },

    labwareScannedHandler: function (barcode) {
      var thisController = this;
      this.model
          .then(this.startProcess(function (model) {
            return model.addRack(barcode);
          }), function () {
            thisController.message('error', "Impossible to load the model!");
          })
          .then(this.finishProcess(function (model) {
            var rackList = _.map(model.inputRacks, _.partial(rackUI, thisController));
            thisController.rackListSelection.empty().append(_.pluck(rackList, "item"));
            _.each(rackList, _.callMemberFunction("render"));
            return model;
          }), this.finishProcess(function (error) {
            thisController.message('error', error.message);
          }))
          .then(function(model) {
            if (model.isReady) {
              thisController.startRerackingBtnSelection.show();
            }
          });
    },

    enableDropzone: function (html) {
      this.dropzone = DropZone.init(html.find('.dropzone'));
      this.dropzone.enable(_.bind(this.responderCallback, this));
    },

    disableDropZone:function(){
      this.dropzone.disable();
    },

    responderCallback: function (fileContent) {
      var deferred = $.Deferred();
      var thisController = this;
      thisController.model
          .then(function (model) {
            thisController.message();
            thisController.view.trigger("s2.busybox.start_process");
            return model.setFileContent(fileContent);
          })
          .fail(function (error) {
            thisController.view.trigger("s2.busybox.end_process");
            thisController.message('error', error.message);
            deferred.reject();
          })
          .then(function (model) {
            thisController.view.trigger("s2.busybox.end_process");
            thisController.outputrackSelection.show();
            thisController.outputRackController = thisController.factory.create('labware_controller', thisController);
            thisController.outputRackController.setupController({
              "expected_type":   "tube_rack",
              "display_labware": true,
              "display_remove":  false,
              "display_barcode": false
            }, function () {
              return thisController.outputrackSelection;
            });
            thisController.outputrackSelection.empty();
            thisController.outputRackController.renderView();
            thisController.outputRackController.updateModel(model.outputRack);
            thisController.disableDropZone();
            deferred.resolve(thisController);
          });
      return deferred.promise();
    },

    onPrintBarcode: function () {
      var thisController = this;
      this.model
          .then(function (model) {
            thisController.view.trigger("s2.busybox.start_process");
            return model.printRackBarcode(thisController.view.find('#printer-select').val());
          })
          .fail(function (error) {
            thisController.view.trigger("s2.busybox.end_process");
            return thisController.message('error', "Couldn't print the barcodes!");
          })
          .then(function () {
            thisController.view.trigger("s2.busybox.end_process");
            thisController.outputSelection.show();
            thisController.startRerackingBtnSelection.hide();
            thisController.accordionSelection.find("h3:nth(2)").show();
            thisController.accordionSelection.accordion("option", "active", 2);
            return thisController.message('success', "The barcodes have been sent to printer.");
          });
    },

    onStartReracking: function () {
      this.outputSelection.show();
      this.startRerackingBtnSelection.hide();
      this.accordionSelection.find("h3:nth(1)").show();
      this.accordionSelection.accordion("option", "active", 1);
      this.printRerackBtnSelection.show();
    },

    onReracking: function () {
      var thisController = this;
      this.model
          .then(function (model) {
            thisController.view.trigger("s2.busybox.start_process");
            return model.rerack();
          })
          .fail(function (error) {
            thisController.view.trigger("s2.busybox.end_process");
            return thisController.message('error', "Couldn't rerack! Please contact the administrator. " + error.message);
          })
          .then(function () {
            thisController.view.trigger("s2.busybox.end_process");
            thisController.rerackingBtnSelection.hide();
            return thisController.message('success', "Reracking completed.");
          });
    },

    message: function (type, message) {
      if (!type) {
        this.view
            .find('.validationText')
            .hide();
      } else {
        this.view
            .find('.validationText')
            .show()
            .removeClass('alert-error alert-info alert-success')
            .addClass('alert-' + type)
            .html(message);
      }
    },

    childDone: function (child, action, data) {
    },

    release: function () {
    }
  });

  return Controller;

  function rackUI(owner, rack, index) {
    var controller = owner.factory.create('labware_controller', owner);
    controller.setupController({
      "expected_type":   "tube_rack",
      "display_labware": true,
      "display_remove":  false,
      "display_barcode": false
    }, selection("li:nth(" + index + ")"));

    var rackRepresentation = representAsLabware(rack);

    return {
      item: "<li>" + rack.labels.barcode.value + "</li>",
      render: function() {
        controller.renderView();
        controller.updateModel(rackRepresentation);
      }
    };

    function selection(s) {
      return function () {
        return owner.rackListSelection.find(s);
      }
    }
  };

  function representAsLabware(rack) {
    return {
      resourceType: rack.resourceType,
      barcode: rack.labels.barcode.value,
      locations: _.chain(rack.tubes).map(tubeToCss).object().value()
    };

    function tubeToCss(tube, location) {
      return [location, empty(tube) ? "empty" : "full"];
    }
    function empty(tube) {
      return tube.aliquots.length == 0;
    }
  }
});

