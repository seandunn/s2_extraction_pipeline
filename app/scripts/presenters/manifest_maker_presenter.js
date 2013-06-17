define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/manifest_maker_partial.html'
  , 'extraction_pipeline/models/manifest_maker_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
  , 'extraction_pipeline/lib/reception_studies'
], function (config, BasePresenter, componentPartialHtml, Model, PubSub, ReceptionTemplates, ReceptionStudies) {
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
      this.view = this.createHtml({
        templates:ReceptionTemplates.templateList,
        studies:ReceptionStudies.studyList,
        printerList:config.printerList
      });
      // it only works if the templates in the select menu are not re-ordered!!
      this.updateSamplePrefixMenu(ReceptionTemplates.templateList[0].template_name);
      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml:function(templateData){
      var thisPresenter = this;
      var html = $(_.template(componentPartialHtml)(templateData));

      this.generateManifestBtnSelection = html.find("#generateManifest");
      this.downloadManifestBtnSelection = html.find("#downloadManifest");
      this.printBCBtnSelection = html.find("#printBC");
      this.templateSelectSelection = html.find("#xls-templates");
      this.printBoxSelection = html.find(".printer-div");

      this.generateManifestBtnSelection.click(onGenerateManifestEventHandler(thisPresenter));
      function onGenerateManifestEventHandler(presenter){ return function(){ presenter.onGenerateManifest(); } }

      this.downloadManifestBtnSelection.hide().click(onDownloadManifestEventHandler(thisPresenter));
      function onDownloadManifestEventHandler(presenter){ return function(){ presenter.onDownloadManifest(); } }

      this.printBCBtnSelection.click(onPrintBarcodeEventHandler(thisPresenter));
      function onPrintBarcodeEventHandler(presenter){ return function(){ presenter.onPrintBarcode(); } }

      this.printBoxSelection.hide();

      this.templateSelectSelection.change(onChangeTemplateEventHandler(thisPresenter));
      function onChangeTemplateEventHandler(presenter){ return function(event){ presenter.onChangeTemplate(event); } }

      html.find("#number-of-sample").bind("keypress",function(event){
            if (event.which !== 13) return;
            onGenerateManifestEventHandler(thisPresenter)();
          }
      );

      return html;
    },

    subscribeToPubSubEvents:function(){
      var thisPresenter = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
      function resetViewEventHandler(event, source, eventData) {
        thisPresenter.reset();
      }
    },

    reset:function(){
      this.model.then(function(model){
        model.reset();
      });
      this.generateManifestBtnSelection.show();
      this.downloadManifestBtnSelection.hide();
      this.printBoxSelection.hide();
      this.enableSampleGeneration();
      this.message();
    },

    enableSampleGeneration:function(){
      this.view.find("form *").removeAttr("disabled");
    },

    disableSampleGeneration:function(){
      this.view.find("form *").attr("disabled","disabled");
      this.generateManifestBtnSelection.hide();
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

    onGenerateManifest: function () {
      var thisPresenter = this;
      var numberValid = /^[1-9]\d*$/.exec(this.view.find('#number-of-sample').val()) !== null;
      if (!numberValid) {
        this.message('error', 'The number of sample is not valid.');
      } else {
        var template = this.view.find('#xls-templates').val();
        var study = this.view.find('#studies').val();
        var nbOfSample = parseInt(this.view.find('#number-of-sample').val());
        this.model
            .then(function (model) {
              thisPresenter.view.trigger("s2.busybox.start_process");
              return model.generateSamples(template, study, nbOfSample);
            })
            .fail(function (error) {
              thisPresenter.view.trigger("s2.busybox.end_process");
              return thisPresenter.message('error', 'Something wrong happened : '+error.message);
            })
            .then(function (model) {
              thisPresenter.disableSampleGeneration();
              thisPresenter.downloadManifestBtnSelection.show();
              thisPresenter.printBoxSelection.show();
              thisPresenter.view.trigger("s2.busybox.end_process");
              return thisPresenter.message('success','Samples generated. The manifest is ready for download, and the barcodes ready for printing.');
            })
      }
    },

    onChangeTemplate:function(event){
      this.updateSamplePrefixMenu($(event.target).val());
    },

    updateSamplePrefixMenu: function (selectedTemplateName) {
      var samplePrefixesSelection = this.view.find("#samplePrefixes").empty();
      var template = findTemplateByName(ReceptionTemplates.templateList, selectedTemplateName);
      refreshSelectionOptionsOnView(samplePrefixesSelection, template.sample_types);

      function findTemplateByName(templates, templateName){
        return _.find(templates, function (template) {
          return template.template_name === templateName;
        });
      }

      function refreshSelectionOptionsOnView(selection, values){
        _.each(values, function(value){
          selection.append('<option value="'+value+'">'+ value + '</option>');
        });
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

