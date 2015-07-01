//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define(["controllers/base_controller"
  , "models/summary_page_model"
  , "text!html_partials/_summary_page.html"
], function (BaseController, Model, summaryPagePartialHtml) {
  "use strict";

  var SummaryPageController = Object.create(BaseController);

  $.extend(SummaryPageController, {
    register: function (callback) {
      callback("summary_page_controller", function (owner, factory, initData) {
        return Object.create(SummaryPageController).init(owner, factory, initData);
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.controllerFactory = factory;
      this.model = Object.create(Model).init(this, config);

      // page is refreshed after 5 seconds
      window.setTimeout(function () {
        location.reload(true);
      }, 5000);

      return this;
    },

    setupController: function (setupData, jquerySelection) {
      var thisController = this;
      thisController.jquerySelection = jquerySelection;

      thisController.model
        .then(function (model) {
          //return model.setupModel(setupData);
        })
        .then(function () {
          thisController.renderView();
        });
      return this;
    },

    renderView: function () {
      var thisController = this;
      var template = _.template(summaryPagePartialHtml);

      var templateData = {};
      if (thisController.config.spentBatch){
        templateData.information = "The current batch is spent. This page will reload in 5 seconds. Once reloaded, scan your current labware to continue the process.";
      }
      else {
        templateData.information = "No role has been found for this process. This page will reload in 5 seconds.";
      }
      templateData.config = thisController.config;
//      var model;

      // This is not leftover code. This has been commented out
      // to disable a summary table that may be used later.
      thisController.model
//        .then(function (result) {
//          model = result;
//          return model.labwares;
//        })
//        .fail(function (error) {
//          thisController.message("error", 'Labware not found for this batch');
//        })
        .then(function (labwares) {
//          templateData.items = transformOrdersAndLabwareToHtmlTemplateData(model.ordersByUUID, labwares, model.batch.uuid);
          thisController.jquerySelection().html(template(templateData));
        });

      return this;
    },
    message:    function (type, message) {
      if (!type) {
        this.jquerySelection()
          .find(".validationText")
          .hide();
      } else {
        this.jquerySelection()
          .find(".validationText")
          .show()
          .removeClass('alert-error alert-info alert-success')
          .addClass("alert-" + type)
          .html(message);
      }
    },

    focus: function(){}

  });

  function transformOrdersAndLabwareToHtmlTemplateData(orders, labwares, modelBatchUUID) {
    var templateData = [];
    _.each(orders, function (order) {
      _.each(order.items, function (itemsByRole) {
        _.each(itemsByRole, function (item) {
          var batch_uuid = item.batch ? item.batch.uuid : "Not found";
          templateData.push({
            order_uuid:     order.uuid,
            role:           item.role,
            status:         item.status,
            type:           getLabwareTypeFromUUID(item.uuid, labwares),
            barcode:        getLabwareBarcodeFromUUID(item.uuid, labwares),
            sanger_barcode: getSangerBarcodeFromUUID(item.uuid, labwares),
            batch_uuid:     batch_uuid,
            display_format: (modelBatchUUID === batch_uuid) ? "enabledRow": "disabledRow"
          });
        });
      });
    });
    return templateData;
  }

  function getLabwareBarcodeFromUUID(labwareUUID, labwares) {
    var labware = getLabwareFromUUID(labwareUUID, labwares);
    if (labware) {
      return (labware.labels.barcode && labware.labels.barcode.value) || "Not found";
    } else {
      return  "Labware not found";
    }
  }

  function getSangerBarcodeFromUUID(labwareUUID, labwares) {
    var labware = getLabwareFromUUID(labwareUUID, labwares);
    if (labware) {
      return  (labware.labels.sangerBarcode && labware.labels.sangerBarcode.value) || "Not Found";
    } else {
      return "Labware not found";
    }
  }

  function getLabwareTypeFromUUID(labwareUUID, labwares) {
    var labware = getLabwareFromUUID(labwareUUID, labwares);
    if (labware) {
      return labware.resourceType || "Type not found";
    } else {
      return "Labware not found";
    }
  }

  function getLabwareFromUUID(labwareUUID, labwares) {
    return _.find(labwares, function (labware) {
      return labware.uuid === labwareUUID;
    });
  }

  return SummaryPageController;
});
