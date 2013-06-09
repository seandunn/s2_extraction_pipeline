define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/manifest_reader_partial.html'
  , 'extraction_pipeline/models/manifest_reader_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
], function (config, BasePresenter, componentPartialHtml, Model, PubSub, ReceptionTemplates) {
  'use strict';

  var Presenter = Object.create(BasePresenter);

  $.extend(Presenter, {
    register: function (callback) {
      callback('manifest_reader_presenter', function() {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
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
      var html = $(_.template(componentPartialHtml)(templateData));

      this.enableDropzone(html);

      html.find("#registrationBtn").hide().click(onRegistrationButtonClickEventHandler(this));
      function onRegistrationButtonClickEventHandler(presenter){return function(){ presenter.onRegistrationButtonClick(); }}

      return html;
    },

    enableDropzone: function (container) {
      var thisPresenter = this;
      var dropzone = container.find('.dropzoneBox');

      // add listeners to the hiddenFileInput
      dropzone.bind('click', handleClickOnDropZone); // forward the click to the hiddenFileInput
      dropzone.bind('drop', handleDropFileOnDropZone);
      dropzone.bind('dragover', handleDragFileOverDropZone);
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
            thisPresenter.enableRegistrationBtn();
            thisPresenter.view.trigger("s2.busybox.end_process");
            thisPresenter.message('success', 'File loaded successfully.');
          })
    },

    enableRegistrationBtn:function(){
      this.view.find("#registrationBtn").show();
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

  return Presenter;
});

