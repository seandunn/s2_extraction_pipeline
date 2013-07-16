define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/reracking_partial.html'
  , 'extraction_pipeline/models/reracking_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/util'
], function (config, BasePresenter, componentPartialHtml, Model, PubSub, Util) {
  'use strict';

  var Presenter = Object.create(BasePresenter);

  $.extend(Presenter, {
    register: function (callback) {
      callback('reracking_presenter', function () {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
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
            printerList: _.filter(config.printerList, function(printer){return printer.type === 3;})
          }
      );
      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function (templateData) {
      var thisPresenter = this;
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
      var scanBarcodePresenter = this.factory.create('scan_barcode_presenter', this).init({type: "labware"});

      this.barcodeReaderSelection.append(
          this.bindReturnKey(scanBarcodePresenter.renderView(),
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


//      this.barcodeReaderSelection.hide();

//      this.generateManifestBtnSelection = html.find("#generateManifest");
//      this.downloadManifestBtnSelection = html.find("#downloadManifest");
//      this.printBCBtnSelection = html.find("#printBC");
//      this.templateSelectSelection = html.find("#xls-templates");
//      this.printBoxSelection = html.find(".printer-div");
//
      this.printRerackBtnSelection.click(onPrintRerackingEventHandler(thisPresenter));
      function onPrintRerackingEventHandler(presenter) {
        return function () {
          presenter.onPrintBarcode();
        }
      }

      this.rerackingBtnSelection.click(onRerackingEventHandler(thisPresenter));
      function onRerackingEventHandler(presenter) {
        return function () {
          presenter.onReracking();
        }
      }

      this.startRerackingBtnSelection.click(onStartRerackingEventHandler(thisPresenter));
      function onStartRerackingEventHandler(presenter) {
        return function () {
          presenter.onStartReracking();
        }
      }

//
//      this.downloadManifestBtnSelection.hide().click(onDownloadManifestEventHandler(thisPresenter));
//      function onDownloadManifestEventHandler(presenter){ return function(){ presenter.onDownloadManifest(); } }
//
//      this.printBCBtnSelection.click(onPrintBarcodeEventHandler(thisPresenter));
//      function onPrintBarcodeEventHandler(presenter){ return function(){ presenter.onPrintBarcode(); } }
//
//      this.printBoxSelection.hide();
//
//      this.templateSelectSelection.change(onChangeTemplateEventHandler(thisPresenter));
//      function onChangeTemplateEventHandler(presenter){ return function(event){ presenter.onChangeTemplate(event); } }
//
//      html.find("#number-of-sample").bind("keypress",function(event){
//            if (event.which !== 13) return;
//            onGenerateManifestEventHandler(thisPresenter)();
//          }
//      );
//
      return html;

      function barcodeErrorCallback(errorText) {
        var errorHtml = function (errorText) {
          return $("<h4/>", {class: "alert-heading", text: errorText});
        };
        return function (event, template, presenter) {
          thisPresenter.message('error', errorText);
          template
              .find('input')
              .val(''); // clear the input
        };
      }

      function labwareCallback(event, template, presenter) {
        template.find('.alert-error').addClass('hide');
        thisPresenter.labwareScannedHandler(Util.pad(event.currentTarget.value));
        thisPresenter.barcodeReaderSelection.find('input').val(''); // clear the input
      }

      function validation(element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) return;
          if (event.currentTarget.value.length === 13) {
            callback(event, element, thisPresenter);
          } else {
            errorCallback(event, element, thisPresenter);
          }
        }
      }
    },

    subscribeToPubSubEvents: function () {
      var thisPresenter = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
      function resetViewEventHandler(event, source, eventData) {
        thisPresenter.reset();
      }
    },

    reset: function () {
      this.model.then(function (model) {
        model.reset();
      });
      this.accordionSelection.accordion("option","active", 0);
      this.rackListSelection.empty();
      this.startRerackingBtnSelection.hide();
      this.rackPresenters = [];
      delete this.outputRackPresenter;
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
      var thisPresenter = this;
      console.log("should talk to the model right now...", barcode);
      thisPresenter.rackPresenters = [];
      thisPresenter.model
          .fail(function () {
            thisPresenter.message('error', "Impossible to load the model!");
          })
          .then(function (model) {
            return model.addRack(barcode);
          })
          .fail(function (error) {
            thisPresenter.message('error', error.message);
          })
          .then(function (model) {
            // creates the rack list from the loaded racks
            thisPresenter.rackPresenters = [];
            var rackList = _.map(model.inputRacks, function (rack, index) {
              var rackPresenter = thisPresenter.factory.create('labware_presenter', thisPresenter);
              function selection(s) {
                return function () {
                  return thisPresenter.rackListSelection.find(s);
                }
              }
              thisPresenter.rackPresenters.push(rackPresenter);
              thisPresenter.rackListSelection.find();
              rackPresenter.setupPresenter({
                "expected_type":   "tube_rack",
                "display_labware": true,
                "display_remove":  false,
                "display_barcode": false
              }, selection("li:nth(" + index + ")"));
              var listItem = "<li>" + rack.labels.barcode.value + "</li>";
              return {"item": listItem, presenter: rackPresenter, rackData: rack};
            });
            var listItems = _.pluck(rackList, "item");
            thisPresenter.rackListSelection.empty().append(listItems);
            _.each(rackList, function (rackItem) {
              rackItem.presenter.renderView();
              rackItem.presenter.updateModel(rackItem.rackData);
            });
            if (model.isReady) {
              // ready to merge
              thisPresenter.startRerackingBtnSelection.show();
            }
          });
    },

    enableDropzone: function () {
      var thisPresenter = this;
      // add listeners to the hiddenFileInput
      thisPresenter.dropzoneSelection.bind('click', handleClickOnDropZone); // forward the click to the hiddenFileInput
      thisPresenter.dropzoneSelection.bind('drop', handleDropFileOnDropZone);
      thisPresenter.dropzoneSelection.bind('dragover', handleDragFileOverDropZone);
      thisPresenter.hiddenFileInputSelection.bind("change", handleInputFileChanged);
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
            thisPresenter.responderCallback(event.target.result);
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
        if (thisPresenter.hiddenFileInputSelection) {
          thisPresenter.hiddenFileInputSelection.click();
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
        if (event.target === thisPresenter.dropzoneSelection[0]) {
          thisPresenter.dropzoneSelection.addClass('hover');
        } else {
          thisPresenter.dropzoneSelection.removeClass('hover');
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
      var thisPresenter = this;
      thisPresenter.model
          .then(function (model) {
            thisPresenter.message();
            thisPresenter.view.trigger("s2.busybox.start_process");
            return model.setFileContent(fileContent);
          })
          .fail(function (error) {
            thisPresenter.view.trigger("s2.busybox.end_process");
            thisPresenter.message('error', error.message);
            deferred.reject();
          })
          .then(function (model) {
            thisPresenter.view.trigger("s2.busybox.end_process");
            thisPresenter.message('success', 'File loaded successfully.');
            thisPresenter.outputrackSelection.show();

            thisPresenter.outputRackPresenter = thisPresenter.factory.create('labware_presenter', thisPresenter);
            thisPresenter.outputRackPresenter.setupPresenter({
              "expected_type":   "tube_rack",
              "display_labware": true,
              "display_remove":  false,
              "display_barcode": false
            }, function () {
              return thisPresenter.outputrackSelection;
            });
            thisPresenter.outputrackSelection.empty();
            thisPresenter.outputRackPresenter.renderView();
            thisPresenter.outputRackPresenter.updateModel(model.outputRack);
            thisPresenter.disableDropZone();
            deferred.resolve(thisPresenter);
          });
      return deferred.promise();
    },

    onPrintBarcode: function () {
      var thisPresenter = this;
      this.model
          .then(function (model) {
            thisPresenter.view.trigger("s2.busybox.start_process");
            return model.createOutputsAndPrint(thisPresenter.view.find('#printer-select').val());
          })
          .fail(function (error) {
            thisPresenter.view.trigger("s2.busybox.end_process");
            return thisPresenter.message('error', "Couldn't print the barcodes!");
          })
          .then(function () {
            thisPresenter.view.trigger("s2.busybox.end_process");
            thisPresenter.outputSelection.show();
            thisPresenter.startRerackingBtnSelection.hide();
            thisPresenter.accordionSelection.find("h3:nth(2)").show();
            thisPresenter.accordionSelection.accordion("option", "active", 2);
            return thisPresenter.message('success', "The barcodes have been sent to printer.");
          });
    },

    onStartReracking: function () {
      this.outputSelection.show();
      this.startRerackingBtnSelection.hide();
      this.accordionSelection.find("h3:nth(1)").show();
      this.accordionSelection.accordion("option", "active", 1);
      this.printRerackBtnSelection.show();

//      this.model
//          .then(function (model) {
//            return model.rerack();
//          })
//          .fail(function (error) {
//            return thisPresenter.message('error', "Couldn't rerack! "+ error.message);
//          });
    },

    onReracking: function () {
      var thisPresenter = this;
      this.model
          .then(function (model) {
            return model.rerack();
          })
          .fail(function (error) {
            return thisPresenter.message('error', "Couldn't rerack! " + error.message);
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

  return Presenter;
});

