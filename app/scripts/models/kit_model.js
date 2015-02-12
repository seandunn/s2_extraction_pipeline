//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init: function (owner, config) {
      this.owner = owner;
      this.config = config;

      this.kitSaved = false;
      this.kit = { valid: false };
      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    setupModel: function (setupData) {
      this.cache.push(setupData.batch);
      this.batch = setupData.batch;
      return $.Deferred().resolve(this).promise();
    },

    validateKitTubes: function (kitType) {
      return (this.config.kitType === kitType);
    },

    setKitFromBarcode:function(kitBarcode){
      var deferred = $.Deferred();
      var thisModel = this;
      var root;
      if (thisModel.batch.kit) {
        if (thisModel.batch.kit === kitBarcode){
          thisModel.kitSaved = true;
          thisModel.kit.barcode = kitBarcode;
          return deferred.resolve(thisModel);
        } else {
          return deferred.reject({message: "The scanned kit is not the one previously used."});
        }
      } else {
        thisModel.owner.getS2Root()
          .then(function (result) {
            root = result;
            return root.kits.searchByBarcode().code128(kitBarcode).first();
          })
          .fail(function () {
            deferred.reject({message: "Kit was not found on the server"});
          })
          .then(function (kit) {
            if (!thisModel.validateKitTubes(kit.aliquotType)){
              return deferred.reject({message: "The kit type is not correct. "+thisModel.config.kitType+" was expected."});
            }
            return thisModel.batch.update({kit: kitBarcode})
          })
          .fail(function () {
            deferred.reject({message: "Unable to save the kit details."});
          })
          .then(function () {
            thisModel.kitSaved = true;
            thisModel.kit.barcode = kitBarcode;
            deferred.resolve(thisModel);
          });
      }
      return deferred.promise();
    }
  });

  return Model;
});
