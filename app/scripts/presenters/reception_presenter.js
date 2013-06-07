define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/reception_partial.html'
  , 'extraction_pipeline/models/reception_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
], function (config, BasePresenter, receptionPartialHtml, Model, PubSub, ReceptionTemplates) {
  'use strict';

  var ReceptionPresenter = Object.create(BasePresenter);

  $.extend(ReceptionPresenter, {
    register: function (callback) {
      callback('reception_presenter', function() {
        var instance = Object.create(ReceptionPresenter);
        ReceptionPresenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.model = Object.create(Model).init(this, config);
      this.view = this.createHtml({templates:ReceptionTemplates.templateList, printerList:config.printerList});
      return this;
    },

    createHtml:function(templateData){
      var html = $(_.template(receptionPartialHtml)(templateData));

      var selectXsl = html.find("#xls-templates");
      selectXsl.val("truc");
      var thisPresenter = this;

      html.find("#generateBC").click(onGenerateBCEventHandler(thisPresenter));
      function onGenerateBCEventHandler(presenter){ return function(){ presenter.onGenerateBC(); } }

      html.find("#downloadManifest").hide().click(onDownloadManifestEventHandler(thisPresenter));
      function onDownloadManifestEventHandler(presenter){ return function(){ presenter.onDownloadManifest(); } }

      html.find("#printBC").click(onPrintBarcodeEventHandler(thisPresenter));
      function onPrintBarcodeEventHandler(presenter){ return function(){ presenter.onPrintBarcode(); } }

      this.enableDropzone(html);

      html.find("#registrationBtn").hide().click(onRegistrationButtonClickEventHandler(thisPresenter));
      function onRegistrationButtonClickEventHandler(presenter){return function(){ presenter.onRegistrationButtonClick(); }}

      html.find(".printer-div").hide();

      html.find("#number-of-sample").bind("keypress",function(event){
        if (event.which !== 13) return;
          onGenerateBCEventHandler(thisPresenter)();
        }
      );

      return html;
    },

    enableDropzone: function (container) {
      var thisPresenter = this;
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
            thisPresenter.disableManifestCreation();
            thisPresenter.enableRegistrationBtn();
            thisPresenter.view.trigger("s2.busybox.end_process");
            thisPresenter.message('success', 'File loaded successfully.');
          })
    },

    enableRegistrationBtn:function(){
      this.view.find("#registrationBtn").show();
    },

    enableDownloadManifest:function(){
      this.view.find("#downloadManifest").show();
    },

    enablePrintBC:function(){
      this.view.find(".printer-div").show();
    },

    disableGenerateBC:function(){
      this.view.find(".columnLeft form *").attr("disabled","disabled");
      this.view.find("#generateBC").hide();
    },

    disableDropzone: function (html) {
      html.find('.dropzoneBox').hide();
      html.find('.dropzone').unbind('click');
      $(document).unbind('drop');
      $(document).unbind('dragover');
    },

    disableRegistration:function(){
      this.view.find(".columnRight *").attr("disabled","disabled");
      this.disableDropzone(this.view);
    },

    disableManifestCreation:function(){
      this.view.find(".columnLeft *").attr("disabled","disabled");
      this.disableGenerateBC();
    },

    onPrintBarcode: function () {
      var thisPresenter = this;
      this.model
          .then(function (model) {
            thisPresenter.view.trigger("s2.busybox.start_process");
            return model.printBarcodes(thisPresenter.view.find('#printer-select').val());
          })
          .fail(function (error) {
            thisPresenter.view.trigger("s2.busybox.end_process");
            return thisPresenter.message('error', "Couldn't print the barcodes!");
          })
          .then(function () {
            thisPresenter.view.trigger("s2.busybox.end_process");
            return thisPresenter.message('success', "The barcodes have been sent to printer.");
          });
    },

    onDownloadManifest: function () {
      var thisPresenter = this;
      this.model
          .then(function (model) {
            // uses the FileSaver plugin
            saveAs(model.manifestBlob, "manifest.xls");
          })
          .fail(function (error) {
            return thisPresenter.message('error', "Couldn't download the manifest! "+ error.message);
          });
    },

    onGenerateBC: function () {
      var thisPresenter = this;
      var nbOfSample = parseInt(this.view.find('#number-of-sample').val());
      if (isNaN(nbOfSample) || nbOfSample <= 0) {
        this.message('error', 'The number of sample is not valid.');
      } else {
        var template = this.view.find('#xls-templates').val();
        this.model
            .then(function (model) {
              thisPresenter.view.trigger("s2.busybox.start_process");
              return model.generateSamples(template, nbOfSample);
            })
            .fail(function (error) {
              thisPresenter.view.trigger("s2.busybox.end_process");
              return thisPresenter.message('error', 'Something wrong happened : '+error.message);
            })
            .then(function (model) {
              thisPresenter.disableRegistration();
              thisPresenter.disableGenerateBC();
              thisPresenter.enableDownloadManifest();
              thisPresenter.enablePrintBC();
              thisPresenter.view.trigger("s2.busybox.end_process");
              return thisPresenter.message('success','Samples generated. The manifest is ready for download, and the barcodes ready for printing.');
            })
      }
    },

    onRegistrationButtonClick:function () {
      var thisPresenter = this;
      this.model
        .then(function(model){
          thisPresenter.view.trigger("s2.busybox.start_process");
          return model.updateSamples();
        })
        .fail(function (error) {
          thisPresenter.view.trigger("s2.busybox.end_process");
          return thisPresenter.message('error', 'Something wrong happened : '+error.message);
        })
        .then(function (model) {
          thisPresenter.disableRegistration();
          thisPresenter.view.trigger("s2.busybox.end_process");
          return thisPresenter.message('success','Samples updated.');
        })
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
    }
  });

  return ReceptionPresenter;
});

