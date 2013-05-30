define([ 'config'
  , 'mapper/s2_root'
  , 'extraction_pipeline/presenters/reception_presenter'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
  , 'text!xls_templates/cgap_lysed_manifest_template.json'
], function (config, S2Root, ReceptionPresenter, BusyBox, alerts, cgapLysedTemplateJSON) {
  'use strict';

  var App = Object.create({});

  $.extend(App, {
    init:             function () {
      _.templateSettings.variable = 'templateData';

      var configuration = {
        excelTemplates: {
          cgap_lysed_manifest_RNA_template:  {
            name: "CGAP - RNA - lysed"
          },
          cgap_lysed_manifest_DNA_template:  {
            name: "CGAP - DNA - lysed"
          }
        },
        printerList:config.printers,
        models: {
          cgap_lysed_manifest_RNA_template:  {
            model:         "tube",
            URI:           "cgap_lysed_manifest_template.xls",
            sample_type:   "RNA",
            json_template: JSON.parse(cgapLysedTemplateJSON)
          },
          cgap_lysed_manifest_DNA_template:  {
            model:         "tube",
            sample_type:   "DNA",
            URI:           "cgap_lysed_manifest_template.xls",
            json_template: JSON.parse(cgapLysedTemplateJSON)
          }
        }
      };

      var receptionPresenter = Object.create(ReceptionPresenter).init(this, configuration);
      $("#content").append(receptionPresenter.view);
      this.addEventHandlers();
    },
    addEventHandlers: function () {
      BusyBox.init();
    },
    getS2Root:        function () {
      if (this.rootPromise === undefined) {
        // User should be passed in here not hard-coded
        this.rootPromise = S2Root.load({user: "username"});
      }
      return this.rootPromise;
    }
  });

  return App;
})
;
