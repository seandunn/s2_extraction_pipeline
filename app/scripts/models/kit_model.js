define([
       'extraction_pipeline/models/base_page_model'
], function(BasePageModel) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init: function(owner, config) {
      this.owner = owner;
      this.config = config;

      this.kitSaved = false;
      this.kit = { barcode: undefined, valid: false };
      return this;
    },

    validateKitTubes:function (kitType) {
      return (this.config.kitType == kitType);
    },

    fire: function() {
      var model = this;
      if (model.kit.barcode && model.kit.valid) {
        model.batch.update({kit: model.kit.barcode}).then(function() {
          model.kitSaved = true;
          model.owner.childDone(model, 'saved', {});
        });
      }
    }
  });

  return Model;
});
