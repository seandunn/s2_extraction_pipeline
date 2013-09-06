define([
  'config'
  , 'models/base_page_model'
], function (config, BasePageModel) {
  'use strict';

  var LabActivitiesModel = Object.create(BasePageModel);

  $.extend(LabActivitiesModel, {
    init:function (owner) {
      this.owner = owner;
      return this;
    },

    setUserFromBarcode: function (barcode) {
      var deferred = $.Deferred();
      if (config.UserData[barcode]){
        this.user = config.UserData[barcode];
        this.owner.getS2Root(this.user)
            .fail(function(){
              deferred.reject({message:"Root couldn't be loaded!"});
            })
            .then(function(){
              deferred.resolve(this);
            });
      } else {
        deferred.reject({message:"User barcode not recognised."});
      }
      return deferred.promise();
    }

  });

  return LabActivitiesModel;
});

