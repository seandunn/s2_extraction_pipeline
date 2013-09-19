define([
  "controllers/base_controller",
  "components/filesaver/filesaver",
  "text!html_partials/_manifest_maker.html",
  "models/manifest_maker_model",
  "lib/pubsub",
  "lib/reception_templates",
  "lib/reception_studies"
], function (BaseController, saveAs, componentPartialHtml, Model, PubSub, ReceptionTemplates, ReceptionStudies) {
  'use strict';

  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register: function (callback) {
      callback('manifest_maker_controller', function() {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.model = Object.create(Model).init(this, config);
      this.buttonClickedFlags = {};
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
      var thisController = this;
      var html = $(_.template(componentPartialHtml)(templateData));

      this.generateManifestBtnSelection = html.find("#generateManifest");
      this.downloadManifestBtnSelection = html.find("#downloadManifest");
      this.printBCBtnSelection = html.find("#printBC");
      this.templateSelectSelection = html.find("#xls-templates");
      this.printBoxSelection = html.find(".printer-div");

      this.generateManifestBtnSelection.click(_.bind(this.onGenerateManifest, this));
      this.downloadManifestBtnSelection.hide().click(_.bind(this.onDownloadManifest, this));
      this.printBCBtnSelection.click(_.bind(this.onPrintBarcode, this));

      this.printBoxSelection.hide();

      this.templateSelectSelection.change(_.bind(this.onChangeTemplate, this));

      html.find("#number-of-sample").bind("keypress",function(event){
            if (event.which !== 13) return;
            thisController.onGenerateManifest();
          }
      );

      return html;
    },

    subscribeToPubSubEvents:function(){
      var thisController = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
      function resetViewEventHandler(event, source, eventData) {
        thisController.reset();
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
      this.printBCBtnSelection.attr("disabled", "disabled");
      if (this.buttonClickedFlags.print) return;
      this.buttonClickedFlags.print = true;

      var thisController = this;
      this.model
          .then(function (model) {
            thisController.view.trigger("s2.busybox.start_process");
            return model.printBarcodes(thisController.view.find('#printer-select').val());
          })
          .fail(function (error) {
            thisController.view.trigger("s2.busybox.end_process");
            return thisController.message('error', "Couldn't print the barcodes!");
          })
          .then(function () {
            thisController.view.trigger("s2.busybox.end_process");
            return thisController.message('success', "The barcodes have been sent to printer.");
          });
    },

    onDownloadManifest: function () {
      var thisController = this;
      this.model
          .then(function (model) {
            // uses the FileSaver plugin
            saveAs(model.manifestBlob, "manifest.xls");
          })
          .fail(function (error) {
            return thisController.message('error', "Couldn't download the manifest! "+ error.message);
          });
    },

    onGenerateManifest: function () {
      var thisController = this;
      thisController.generateManifestBtnSelection.attr("disabled", "disabled");
      if (thisController.buttonClickedFlags.generate) return;
      thisController.buttonClickedFlags.generate = true;

      var numberValid = /^[1-9]\d*$/.exec(this.view.find('#number-of-sample').val()) !== null;
      if (!numberValid) {
        this.message('error', 'The number of sample is not valid.');
      } else {
        var template = this.view.find('#xls-templates').val();
        var study = this.view.find('#studies').val();
        var sampleType = this.view.find('#samplePrefixes').val();
        var nbOfSample = parseInt(this.view.find('#number-of-sample').val());
        this.model
            .then(function (model) {
              thisController.view.trigger("s2.busybox.start_process");
              return model.generateSamples(template, study, sampleType, nbOfSample);
            })
            .fail(function (error) {
              thisController.view.trigger("s2.busybox.end_process");
              return thisController.message('error', 'Something wrong happened : '+error.message);
            })
            .then(function (model) {
              thisController.disableSampleGeneration();
              thisController.downloadManifestBtnSelection.show();
              thisController.printBoxSelection.show();
              thisController.view.trigger("s2.busybox.end_process");

              thisController.downloadManifestBtnSelection.click();
              return thisController.message('success','Samples generated and manifest saved. Barcodes ready for printing.');
            });
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

  return Controller;
});

