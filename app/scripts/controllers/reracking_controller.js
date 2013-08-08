define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/reracking_partial.html'
  , 'models/reracking_model'
  , 'lib/pubsub'
  , 'lib/util'
], function (config, BaseController, componentPartialHtml, Model, PubSub, Util) {
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
      this.dropzoneSelection = html.find('.dropzone');
      this.dropzoneBoxSelection = html.find('.dropzoneBox');
      this.rerackingBtnSelection = html.find('#rerack-btn');
      this.printRerackBtnSelection = html.find('#print-rerack-btn');
      this.startRerackingBtnSelection = html.find('#start-rerack-btn');
      this.hiddenFileInputSelection = html.find('.hiddenFileInput');
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
      this.enableDropzone();
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
      this.rackControllers = [];
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
      thisController.rackControllers = [];
      thisController.model
          .fail(function () {
            thisController.message('error', "Impossible to load the model!");
          })
          .then(function (model) {
            thisController.view.trigger("s2.busybox.start_process");

            return model.addRack(barcode);
          })
          .fail(function (error) {
            thisController.view.trigger("s2.busybox.end_process");

            thisController.message('error', error.message);
          })
          .then(function (model) {
            // creates the rack list from the loaded racks
            thisController.rackControllers = [];
            var rackList = _.map(model.inputRacks, function (rack, index) {
              var rackController = thisController.factory.create('labware_controller', thisController);
              function selection(s) {
                return function () {
                  return thisController.rackListSelection.find(s);
                }
              }
              thisController.rackControllers.push(rackController);
              thisController.rackListSelection.find();
              rackController.setupController({
                "expected_type":   "tube_rack",
                "display_labware": true,
                "display_remove":  false,
                "display_barcode": false
              }, selection("li:nth(" + index + ")"));
              var listItem = "<li>" + rack.labels.barcode.value + "</li>";
              return {"item": listItem, controller: rackController, rackData: rack};
            });
            var listItems = _.pluck(rackList, "item");
            thisController.rackListSelection.empty().append(listItems);
            _.each(rackList, function (rackItem) {
              rackItem.controller.renderView();
              rackItem.controller.updateModel(rackItem.rackData);
            });
            if (model.isReady) {
              // ready to merge
              thisController.startRerackingBtnSelection.show();
            }
            thisController.view.trigger("s2.busybox.end_process");
          });
    },

    enableDropzone: function () {
      var thisController = this;
      // add listeners to the hiddenFileInput
      thisController.dropzoneSelection.bind('click', handleClickOnDropZone); // forward the click to the hiddenFileInput
      thisController.dropzoneSelection.bind('drop', handleDropFileOnDropZone);
      thisController.dropzoneSelection.bind('dragover', handleDragFileOverDropZone);
      thisController.hiddenFileInputSelection.bind("change", handleInputFileChanged);
      //
      function handleInputFile(fileHandle) {
        // what to do when a file has been selected
        var reader = new FileReader();
        reader.onload = (function (fileEvent) {
          return function (e) {
          }
        })(fileHandle);
        reader.onloadend = function (event) {
          if (event.target.readyState === FileReader.DONE) {
            thisController.responderCallback(event.target.result);
          }
        };
        reader.readAsText(fileHandle, "UTF-8");
      }

      //
      function handleInputFileChanged(event) {
        // what to do when the file selected by the hidden input changed
        event.stopPropagation();
        event.preventDefault();
        handleInputFile(event.originalEvent.target.files[0]);
      }

      //
      function handleClickOnDropZone(event) {
        // what to do when one clicks on the drop zone
        event.stopPropagation();
        event.preventDefault();
        if (thisController.hiddenFileInputSelection) {
          thisController.hiddenFileInputSelection.click();
        }
      }

      //
      function handleDropFileOnDropZone(event) {
        // what to do when one drops a file
        event.stopPropagation();
        event.preventDefault();
        handleInputFile(event.originalEvent.dataTransfer.files[0]);
      }

      //
      function handleDragFileOverDropZone(event) {
        // what to do when one hovers over the dropzone
        event.stopPropagation();
        event.preventDefault();
        if (event.target === thisController.dropzoneSelection[0]) {
          thisController.dropzoneSelection.addClass('hover');
        } else {
          thisController.dropzoneSelection.removeClass('hover');
        }
      }
    },

    disableDropZone:function(){
      this.dropzoneBoxSelection.hide();
      this.dropzoneSelection.unbind('click');
      $(document).unbind('drop');
      $(document).unbind('dragover');
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
});

