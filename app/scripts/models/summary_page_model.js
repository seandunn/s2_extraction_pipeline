define([
  'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var SummaryPageModel = Object.create(BasePageModel);

  $.extend(SummaryPageModel, {

    init: function (owner) {
      this.owner = owner;
      this.tubes = $.Deferred();
      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    setupModel: function (setupData) {
      this.cache.push(setupData.batch);
      this.user = setupData.user;
      this.batch = setupData.batch;
      var deferred = $.Deferred();

      return deferred.resolve(this).promise();
    }
  });

  return SummaryPageModel;
});


