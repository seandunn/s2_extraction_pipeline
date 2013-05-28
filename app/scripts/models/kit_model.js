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
            return root.kits.findByEan13Barcode(kitBarcode);
          })
          .fail(function () {
            deferred.reject({message: "Kit was not found on the server"});
          })
          .then(function (kit) {
            if (!thisModel.validateKitTubes(kit.aliquotType)){
              return deferred.reject({message: "The kit type is not correct. "+this.config.aliquotType+" was expected."});
            }
            return thisModel.batch.update({kit: kitBarcode})
          })
          .fail(function () {
            deferred.reject({message: "Unable to save the kit details."});
          })
          .then(function () {
            thisModel.kitSaved = true;
            thisModel.kit.barcode = kitBarcode;
            //thisModel.owner.childDone(thisModel, 'saved', {});
            deferred.resolve(thisModel);
          });
      }
      return deferred.promise();
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
