define([
  'extraction_pipeline/models/base_page_model',
  'mapper/operations',
  'extraction_pipeline/models/connected'
], function (BasePageModel, Operations, Connected) {

  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, Connected, {
    init:function (owner, initData) {
      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;

      this.initialiseCaching();
      this.initialiseConnections(initData);
      return this;
    },

    checkPageComplete:function() {
      return true;
    }
  });

  return Model;

})
