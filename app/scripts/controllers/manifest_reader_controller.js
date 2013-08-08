define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/manifest_reader_partial.html'
  , 'text!html_partials/sample_row_partial.html'
  , 'models/manifest_reader_model'
  , 'lib/pubsub'
  , 'lib/reception_templates'
], function (config, BaseController, componentPartialHtml, sampleRowPartial, Model, PubSub, ReceptionTemplates) {
  'use strict';

  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register: function (callback) {
      callback('manifest_reader_controller', function () {
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
      this.view = this.createHtml({templates: ReceptionTemplates.templateList, printerList: config.printerList});
      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function (templateData) {
      var html = $(_.template(componentPartialHtml)(templateData));
      // saves the selection for performances
      this.dropzoneSelection = html.find('.dropzone');
      this.dropzoneBoxSelection = html.find('.dropzoneBox');
      this.registerBtnSelection = html.find('#registrationBtn');
      this.fileNameSpanSelection = html.find('.filenameSpan');
      this.hiddenFileInputSelection = html.find('.hiddenFileInput');
      this.orderMakerSelection = html.find(".orderMaker");

      this.enableDropzone();
      this.registerBtnSelection.hide().click(onRegistrationButtonClickEventHandler(this));
      function onRegistrationButtonClickEventHandler(controller) {
        return function () {
          controller.onRegisterButtonClick();
        }
      }

      return html;
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
      this.dropzoneBoxSelection.show();
      this.registerBtnSelection.hide();
      this.fileNameSpanSelection.empty();
      this.hiddenFileInputSelection.removeAttr('disabled');
      this.removeSamplesView();
      this.message();
    },

    // dropzone

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
            thisController.fileNameSpanSelection.text(fileHandle.name);
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
            thisController.registerBtnSelection.show();
            thisController.createSamplesView(model);
            thisController.hiddenFileInputSelection.attr('disabled', 'disabled');
//            thisController.barcodeReaderSelection.find('.barcodeInput').focus(); // does not work!!??
            thisController.view.trigger("s2.busybox.end_process");
            deferred.resolve(thisController);
          });
      return deferred.promise();
    },

    // Samples View

    createSamplesView: function (model) {

      var headers = _.map(model.samplesForDisplay[0], function (column) {
          var columnKey = Object.keys(column)[0];
          var content = column[columnKey];
          if ($.isPlainObject(content)) {
            return content.friendlyName || columnKey;
          } else {
            return columnKey;
          }
        });

      function createSelectTag(cell){
        var currentValue = cell.value || cell.default;
        var select = $("<select />");
        select.addClass(cell.class);
        select.attr("data-name_of_column",cell.columnName);
        _.each(cell.options, function (option) {
          $("<option></option>", {value: option, text: option}).appendTo(select);
        });
        select.find('option').filter(function() {
          return $.trim($(this).text()).toUpperCase() === $.trim(currentValue).toUpperCase();
        }).attr('selected', 'selected');
        return select.wrap('<div/>').parent().html();
      }

      function createCheckBoxTag(cell){
        var currentValue = cell.value || cell.default;
        var checkbox = $("<input type='checkbox' />");
        checkbox.addClass(cell.class);
        checkbox.attr("data-name_of_column",cell.columnName);
        if (currentValue) { checkbox.attr('checked', 'checked'); }
        return checkbox.wrap('<div/>').parent().html();
      }

      function createSpanTag(cell){
        var currentValue = cell.value || cell.default;
        var span = $("<span />");
        span.addClass(cell.class);
        span.attr("data-name_of_column",cell.columnName);
        span.text(currentValue);
        return span.wrap('<div/>').parent().html();
      }

      var sampleData =
          _.map(model.samplesForDisplay, function (sample) {
            return _.map(sample, function (column) {
              var columnKey = Object.keys(column)[0];
              var content = column[columnKey];
              if ($.isPlainObject(content)) {
                switch (content.type) {
                  case "select":
                    return createSelectTag(content);
                  case "checkbox":
                    return createCheckBoxTag(content);
                  default:
                    return createSpanTag(content);
                }
              }
              return content;
            });
          });
      this.orderMakerSelection.append(_.template(sampleRowPartial)({headers:headers, data: sampleData}));

      this.dropzoneBoxSelection.hide();
      this.orderMakerSelection
          .find("td input")
          .filter(function(){
            return $(this).data('name_of_column')==='_SELECTED';
          })
          .on("click", function (event) {
            toggleRowEnabled($(event.target).closest('tr'));
          });
      enableRow(this.orderMakerSelection.find("tr"));
      this.orderMakerSelection.show();
    },

    removeSamplesView: function () {
      this.orderMakerSelection.empty();
    },


    // register btn

    onRegisterButtonClick: function () {
      var thisController = this;

      // prevent user from clicking multiple times
      if (this.registerBtnClicked) return;
      this.registerBtnClicked = true;
      this.registerBtnSelection.attr('disabled', 'disabled');

      this.model
          .then(function (model) {
            thisController.view.trigger("s2.busybox.start_process");
            var rows = thisController.orderMakerSelection.find("tbody tr.success");

            var dataFromGUI = $.makeArray(rows.map(function(){
              var sample = {};
              $(this).find('td').each(function(){
                var data = $(this).find(":first").data();
                if (data) {
                  if ($(this).find("input:checkbox:first").length > 0) {
                    sample[data.name_of_column] = $(this).find("input:checkbox:first").is(":checked");
                  } else if ($(this).find("select:first").length > 0) {
                    sample[data.name_of_column] = $(this).find("select:first").val();
                  } else {
                    sample[data.name_of_column] = $(this).find("span:first").text();
                  }
                }
              });
              return sample;
            }));

            return model.updateSamples(dataFromGUI);
          })
          .fail(function (error) {
            thisController.view.trigger("s2.busybox.end_process");
            thisController.registerBtnClicked = false;
            thisController.registerBtnSelection.removeAttr('disabled');
            return thisController.message('error', 'Something wrong happened : ' + error.message);
          })
          .then(function (model) {
            thisController.registerBtnSelection.hide();
            thisController.dropzoneBoxSelection.hide();
            thisController.view.trigger("s2.busybox.end_process");
            return thisController.message('success', 'Samples updated.');
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

  return Controller;

  function disableRow(tr) {
    tr.find("select").attr("disabled", true);
    tr.find("input").prop('checked', false);
    tr.addClass("disabledRow").removeClass("success");
  }

  function enableRow(tr) {
    tr.find("select").attr("disabled", false);
    tr.find("input").prop('checked', true).attr("disabled", false);
    tr.addClass("success").removeClass("disabledRow");
  }

  function toggleRowEnabled(tr) {
    var currentlyDisabled = tr.find("select").attr("disabled");
    if (currentlyDisabled) {
      enableRow(tr);
    }
    else {
      disableRow(tr);
    }
  }

});

