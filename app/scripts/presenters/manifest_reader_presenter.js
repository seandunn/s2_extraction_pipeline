define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/manifest_reader_partial.html'
  , 'text!extraction_pipeline/html_partials/sample_row_partial.html'
  , 'extraction_pipeline/models/manifest_reader_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
], function (config, BasePresenter, componentPartialHtml, sampleRowPartial, Model, PubSub, ReceptionTemplates) {
  'use strict';

  var Presenter = Object.create(BasePresenter);

  $.extend(Presenter, {
    register: function (callback) {
      callback('manifest_reader_presenter', function () {
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
      this.view = this.createHtml({templates: ReceptionTemplates.templateList, printerList: config.printerList});
      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function (templateData) {
      var thisPresenter = this;
      var html = $(_.template(componentPartialHtml)(templateData));
      // saves the selection for performances
      this.dropzoneSelection = html.find('.dropzone');
      this.dropzoneBoxSelection = html.find('.dropzoneBox');
      this.registerBtnSelection = html.find('#registrationBtn');
      this.fileNameSpanSelection = html.find('.filenameSpan');
      this.hiddenFileInputSelection = html.find('.hiddenFileInput');
      this.orderMakerSelection = html.find(".orderMaker");
      this.barcodeReaderSelection = html.find("#barcodeReader");

      var scanBarcodePresenter = this.factory.create('scan_barcode_presenter', this).init({type: "labware"});
//      this.barcodeReaderSelection.append(scanBarcodePresenter.renderView());

      var errorCallback = barcodeErrorCallback('Barcode must be a 13 digit number.');

      this.barcodeReaderSelection.append(this.bindReturnKey(scanBarcodePresenter.renderView(), labwareCallback, errorCallback, validation));
      this.barcodeReaderSelection.hide();

      this.enableDropzone();
      this.registerBtnSelection.hide().click(onRegistrationButtonClickEventHandler(this));
      function onRegistrationButtonClickEventHandler(presenter) {
        return function () {
          presenter.onRegisterButtonClick();
        }
      }

      return html;

      function barcodeErrorCallback(errorText) {
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
      }

      function labwareCallback(event, template, presenter) {
        template.find('.alert-error').addClass('hide');
        thisPresenter.labwareScannedHandler(event.currentTarget.value);
      }

      function validation(element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) return;
          //if (BarcodeChecker.isBarcodeValid(event.currentTarget.value)) {
          callback(event, element, thisPresenter);
//          } else {
//            errorCallback(event, element, thisPresenter);
//          }
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
      this.dropzoneBoxSelection.show();
      this.registerBtnSelection.hide();
      this.fileNameSpanSelection.empty();
      this.removeSamplesView();
      this.message();
    },

    // dropzone

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
            thisPresenter.fileNameSpanSelection.text(fileHandle.name);
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

    responderCallback: function (fileContent) {
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
          })
          .then(function (model) {
            thisPresenter.registerBtnSelection.show();
            thisPresenter.createSamplesView(model);
            thisPresenter.barcodeReaderSelection.show();
//            thisPresenter.barcodeReaderSelection.find('.barcodeInput').focus(); // does not work!!??
            thisPresenter.view.trigger("s2.busybox.end_process");
            thisPresenter.message('success', 'File loaded successfully.');
          })
    },

    // Samples View

    createSamplesView: function (model) {
      _.map(model.samplesForDisplay, function (sample) {
        _.each(sample, function (value, key) {
          if ($.isPlainObject(value)) {
            switch (value.type) {
              case "select":
                sample[key] = "<select>"
                    + _.map(value.choices,function (choice) {
                  return "<option value='" + choice + "' " + (value.value.toUpperCase() === choice.toUpperCase() ? "selected" : "") + " >" + choice + "</option>";
                }).join()
                    + "</select>";
                return;
              case "checkbox":
                sample[key] = "<input type='checkbox' " + (value.value ? " checked='checked' " : "") + (value.class ? " class=" + value.class : "") + ">";
                return;
            }
          }
        });
        return sample;
      });
      this.orderMakerSelection.append(_.template(sampleRowPartial)({data: model.samplesForDisplay}));
      this.orderMakerSelection.find("td .selectedForRegistration").on("click", function (event) {
        disableRow($(event.target).closest('tr'));
      });
      disableRow(this.orderMakerSelection.find("tr"));
      this.orderMakerSelection.show();
    },

    removeSamplesView: function () {
      this.orderMakerSelection.empty();
    },

    labwareScannedHandler: function (barcode) {
      var tr = this.orderMakerSelection.find('table td').filter(function () {
        return $.trim($(this).text()).toUpperCase() === barcode.toUpperCase();
      }).closest("tr");
      enableRow(tr);
    },

    // register btn

    onRegisterButtonClick: function () {
      var thisPresenter = this;
      this.model
          .then(function (model) {
            thisPresenter.view.trigger("s2.busybox.start_process");
            return model.updateSamples();
          })
          .fail(function (error) {
            thisPresenter.view.trigger("s2.busybox.end_process");
            return thisPresenter.message('error', 'Something wrong happened : ' + error.message);
          })
          .then(function (model) {
            thisPresenter.registerBtnSelection.hide();
            thisPresenter.dropzoneBoxSelection.hide();
            thisPresenter.view.trigger("s2.busybox.end_process");
            return thisPresenter.message('success', 'Samples updated.');
          })
    },

    // message box

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
    }
  });

  return Presenter;

  function disableRow(tr) {
    tr.find("select").attr("disabled", true);
    tr.find("input").prop('checked', false).attr("disabled", true);
    tr.addClass("disabledRow").removeClass("selectedRow");
  }

  function enableRow(tr) {
    tr.find("select").attr("disabled", false);
    tr.find("input").prop('checked', true).attr("disabled", false);
    tr.addClass("selectedRow").removeClass("disabledRow");
  }

});

