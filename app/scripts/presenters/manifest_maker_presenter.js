define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/manifest_maker_partial.html'
  , 'extraction_pipeline/models/manifest_maker_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
], function (config, BasePresenter, componentPartialHtml, Model, PubSub, ReceptionTemplates) {
  'use strict';

  var Presenter = Object.create(BasePresenter);

  $.extend(Presenter, {
    register: function (callback) {
      callback('manifest_maker_presenter', function() {
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

      var selectXsl = html.find("#xls-templates");
      selectXsl.val("truc");
      var thisPresenter = this;

      html.find("#generateBC").click(onGenerateBCEventHandler(thisPresenter));
      function onGenerateBCEventHandler(presenter){ return function(){ presenter.onGenerateBC(); } }

      html.find("#downloadManifest").hide().click(onDownloadManifestEventHandler(thisPresenter));
      function onDownloadManifestEventHandler(presenter){ return function(){ presenter.onDownloadManifest(); } }

      html.find("#printBC").click(onPrintBarcodeEventHandler(thisPresenter));
      function onPrintBarcodeEventHandler(presenter){ return function(){ presenter.onPrintBarcode(); } }

      html.find(".printer-div").hide();

      html.find("#number-of-sample").bind("keypress",function(event){
            if (event.which !== 13) return;
            onGenerateBCEventHandler(thisPresenter)();
          }
      );

      return html;
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
              thisPresenter.disableGenerateBC();
              thisPresenter.enableDownloadManifest();
              thisPresenter.enablePrintBC();
              thisPresenter.view.trigger("s2.busybox.end_process");
              return thisPresenter.message('success','Samples generated. The manifest is ready for download, and the barcodes ready for printing.');
            })
      }
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

