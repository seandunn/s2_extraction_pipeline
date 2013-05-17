define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/volume_control_partial.html'
  , 'extraction_pipeline/models/volume_control_model'
  , 'extraction_pipeline/lib/pubsub'
], function (config, BasePresenter, volumeControlPartialHtml, Model, PubSub) {
  'use strict';

  var VolumeControlPresenter = Object.create(BasePresenter);

  $.extend(VolumeControlPresenter, {
    register: function (callback) {
      callback('volume_control_presenter', function (owner, factory, initData) {
        return Object.create(VolumeControlPresenter).init(owner, factory, initData);
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.presenterFactory = factory;
      this.model = Object.create(Model).init(this, config);
      return this;
    },

    initialPresenter: function () {
    },

    focus: function () {
    },

    setupPresenter: function (setupData, jquerySelection) {
      var thisPresenter = this;
      thisPresenter.jquerySelection = jquerySelection;

      thisPresenter.model
          .then(function (model) {
            return model.setupModel(setupData);
          })
          .then(function () {
            thisPresenter.jquerySelectionForRack = function () {
              return jquerySelection().find('.dropzone .labware');
            };
            thisPresenter.jquerySelectionForControlTube = function () {
              return jquerySelection().find('.control .labware');
            };
            thisPresenter.rackPresenter = thisPresenter.presenterFactory.create('labware_presenter', thisPresenter);
            thisPresenter.controlPresenter = thisPresenter.presenterFactory.create('labware_presenter', thisPresenter);

            thisPresenter.rackPresenter.setupPresenter({
              "expected_type":   "rack",
              "display_labware": true,
              "display_remove":  false,
              "display_barcode": false
            }, thisPresenter.jquerySelectionForRack);

            thisPresenter.controlPresenter.setupPresenter({
              "expected_type":   "tube",
              "display_labware": true,
              "display_remove":  true,
              "display_barcode": true
            }, thisPresenter.jquerySelectionForControlTube);

            PubSub.subscribe("s2.labware.barcode_scanned", barcodeScannedEventHandler);
            PubSub.subscribe("s2.labware.removed", controlLabwareRemovedEventHandler);
            PubSub.subscribe("s2.step_presenter.end_clicked", makeTransferEventHandler);
            PubSub.subscribe("s2.step_presenter.next_clicked", endProcessEventHandler);

            function barcodeScannedEventHandler(event, source, eventData) {
              thisPresenter.barcodeScanned(event, source, eventData);
            }

            function controlLabwareRemovedEventHandler(event, source, eventData) {
              thisPresenter.controlLabwareRemoved(event, source, eventData);
            }

            function makeTransferEventHandler(event, source, eventData) {
              thisPresenter.makeTransfer();
            }

            function endProcessEventHandler(event, source, eventData) {
              thisPresenter.endProcess();
            }

            thisPresenter.renderView();
          });

      return this;
    },

    barcodeScanned: function (event, source, eventData) {
      var thisPresenter = this;
      thisPresenter.model
          .fail(failureCallback("couldn't get the model"))
          .then(function (model) {
            return model.setControlSourceFromBarcode(eventData.BC);
          })
          .fail(failureCallback("couldn't set the source control "))
          .then(function (model) {
            thisPresenter.controlPresenter.updateModel(model.controlSource);
          });
    },

    controlLabwareRemoved: function (event, source, eventData) {
      var thisPresenter = this;
      thisPresenter.model
          .fail(failureCallback("coudln't get the model"))
          .then(function (model) {
            model.removeControlSource();
            return thisPresenter.controlPresenter.updateModel(model.controlSource);
          })
          .fail(failureCallback("coudln't remove the source control from the model."))
    },

    makeTransfer: function () {
      var thisPresenter = this;
      thisPresenter.disableDropzone();

      var container = this.jquerySelection();
      container.find('.component').trigger("s2.busybox.start_process");

      thisPresenter.controlPresenter.hideEditable();

      thisPresenter.model
          .then(function (model) {
            return model.addVolumeControlToRack();
          })
          .fail(function (error) {
            thisPresenter.message('error', error.message);
            container.find('.component').trigger("s2.busybox.end_process");
            PubSub.publish("s2.step_presenter.disable_buttons", thisPresenter, {buttons: [
              {action: "end"}
            ]});
          })
          .then(function (model) {
            thisPresenter.message('success', 'The transfert was successful. Click on the \'Done\' button to carry on.');
            container.find('.component').trigger("s2.busybox.end_process");
            PubSub.publish("s2.step_presenter.disable_buttons", thisPresenter, {buttons: [
              {action: "end"}
            ]});
            PubSub.publish("s2.step_presenter.enable_buttons", thisPresenter, {buttons: [
              {action: "next"}
            ]});
          })
    },

    endProcess: function () {
      var thisPresenter = this;
      this.model.then(function (model) {
        PubSub.publish("s2.step_presenter.next_process", thisPresenter, {batch: model.batch});
      });
    },

    responderCallback: function (fileContent) {
      var thisPresenter = this;
      thisPresenter.model
          .then(function (model) {
            thisPresenter.message();
            return model.setRackContent(fileContent);
          })
          .fail(function (error) {
            thisPresenter.rackPresenter.resourcePresenter.resetWeels();
            thisPresenter.message('error', error.message);
          })
          .then(function (model) {
            thisPresenter.rackPresenter.updateModel(model.rack_data);
            var volumeControlPosition = model.findVolumeControlPosition();
            thisPresenter.rackPresenter.resourcePresenter.fillWell(volumeControlPosition, "blue");
            if (model.isReady) {
              PubSub.publish("s2.step_presenter.enable_buttons", thisPresenter, {buttons: [
                {action: "end"}
              ]});
            }
          })
    },

    disableDropzone: function () {
      var container = this.jquerySelection();
      container.find('.dropzoneBox').hide();
      container.find('.dropzone').unbind('click');
      $(document).unbind('drop');
      $(document).unbind('dragover');
    },

    enableDropzone: function () {
      var thisPresenter = this;
      var container = this.jquerySelection();
      container.find('.dropzoneBox').show();

      var dropzone = container.find('.dropzone');

      // add listeners to the hiddenFileInput
      dropzone.bind('click', handleClickOnDropZone); // forward the click to the hiddenFileInput
      $(document).bind('drop', handleDropFileOnDropZone);
      $(document).bind('dragover', handleDragFileOverDropZone);
      var fileNameSpan = container.find('.filenameSpan');

      var hiddenFileInput = container.find('.hiddenFileInput');
      hiddenFileInput.bind("change", handleInputFileChanged);

      function handleInputFile(fileHandle) {
        // what to do when a file has been selected
        var reader = new FileReader();
        reader.onload = (function (fileEvent) {
          return function (e) {
            fileNameSpan.text(fileHandle.name);
          }
        })(fileHandle);
        reader.onloadend = function (event) {
          if (event.target.readyState === FileReader.DONE) {
            thisPresenter.responderCallback(event.target.result);
          }
        };
        reader.readAsText(fileHandle, "UTF-8");
      }

      function handleInputFileChanged(event) {
        // what to do when the file selected by the hidden input changed
        event.stopPropagation();
        event.preventDefault();
        handleInputFile(event.originalEvent.target.files[0]);
      }

      function handleClickOnDropZone(event) {
        // what to do when one clicks on the drop zone
        event.stopPropagation();
        event.preventDefault();
        if (hiddenFileInput) {
          hiddenFileInput.click();
        }
      }

      function handleDropFileOnDropZone(event) {
        // what to do when one drops a file
        event.stopPropagation();
        event.preventDefault();
        handleInputFile(event.originalEvent.dataTransfer.files[0]);
      }

      function handleDragFileOverDropZone(event) {
        // what to do when one hovers over the dropzone
        event.stopPropagation();
        event.preventDefault();
        if (event.target === dropzone[0]) {
          dropzone.addClass('hover');
        } else {
          dropzone.removeClass('hover');
        }
      }

    },

    renderView: function () {
      var thisPresenter = this;
      thisPresenter.jquerySelection().html(_.template(volumeControlPartialHtml)({}));
      thisPresenter.rackPresenter.renderView();
      thisPresenter.controlPresenter.renderView();


      thisPresenter.model
          .then(function (model) {
            return model.inputs;
          })
          .then(function (inputs) {
            var nbTubesInRack = _.keys(inputs[0].tubes).length;
            if ( 96 <= nbTubesInRack ) {
              thisPresenter.disableDropzone();
              thisPresenter.jquerySelectionForControlTube().hide();
              thisPresenter.message("info","The tube rack found in batch contains "+nbTubesInRack
                  +" tubes. It is not possible to add a volume-control tube.");
              // TODO : enable the possible to carry on to volume checking
            } else {
              thisPresenter.enableDropzone();
            }
          });

      return this;
    },

    message: function (type, message) {
      if (!type) {
        this.jquerySelection()
            .find('.validationText')
            .hide();
      } else {
        this.jquerySelection()
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

  var barcodeErrorCallback = function (errorText) {
    var errorHtml = function (errorText) {
      return $("<h4/>", {class: "alert-heading", text: errorText});
    };

    return function (event, template, presenter) {
      template.
          find('.alert-error').
          html(errorHtml(errorText)).
          removeClass('hide');

      template.
          find('input').
          removeAttr('disabled');
    };
  };

  function failureCallback(msg) {
    return function (error) {
      console.error(msg, error);
      return { "error": msg, previousError: error };
    }
  }

  return VolumeControlPresenter;
});

