define([
       'extraction_pipeline/models/base_page_model'
], function(BasePageModel) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init: function(owner, config) {
      this.owner = owner;
      this.config = config;

      this.user = undefined;
      this.batch = undefined;
      this.kitSaved = false;
      return this;
    },

    validateKitTubes:function (kitType) {
      return (this.config.kitType == kitType);
    },
  });

  return Model;
});
