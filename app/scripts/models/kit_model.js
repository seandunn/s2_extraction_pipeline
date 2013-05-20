define([
  'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init: function (owner, config) {
      this.owner = owner;
      this.config = config;

      this.kitSaved = false;
      this.kit = { valid: false };
      return this;
    },

    validateKitTubes: function (kitType) {
      return (this.config.kitType == kitType);
    },

    fire: function () {
      var model = this;
      var root;

      if (model.kit.barcode) {
        this.owner.getS2Root()
          .then(function (result) {
            root = result;
          })
          .then(function () {
            return root.kits.findByEan13Barcode(model.kit.barcode);
          })
          .then(function (kit) {
            model.batch.update({kit: model.kit.barcode})
              .then(function () {
                model.kitSaved = true;
                model.owner.childDone(model, 'saved', {});
              })
              .fail(function () {
                $('body').trigger('s2.status.error', "Couldn't save the kit'");
              })
          })
          .fail(function () {
            $('body').trigger('s2.status.error', "Kit is not valid");
          });
      }
    }
  });

  return Model;
});
