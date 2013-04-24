define([
  'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init:function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.user = undefined;
      this.batch = undefined;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
//      this.initialiseConnections(config);
      return this;
    },
    fire:function () {

      //this.preparedTransferData;

      this.owner.childDone(this, "transferDone", {});
    },
    analyseFileContent:function (data) {
      this.preparedTransferData = {};
      this.owner.childDone(this, "fileValid");
//      this.owner.childDone(this,"error", {message:"wrong!"});
    },
    setBatch:function (batch) {
      this.cache.push(batch);
      this.batch = batch;
      var model = this;
      setupInputs(this)
          .then(function () {
            model.owner.childDone(model, "batchAdded");
          })
          .fail(function () {
            model.owner.childDone(model, "error", {message:"couldn't load the batch resources!"});
          });
    },
    setUser:function (userUUID) {
      this.user = userUUID;
      this.owner.childDone(this, "userAdded");
    }

//    validateKitTubes:function (kitType) {
//      return (this.config.kitType == kitType);
//    },

//    fire: function() {
//      var model = this;
//      if (model.kit.barcode && model.kit.valid) {
//        model.batch.update({kit: model.kit.barcode}).then(function() {
//          model.kitSaved = true;
//          model.owner.childDone(model, 'saved', {});
//        });
//      }
//    }
  });

  function setupInputs(that) {
    var inputs = [];
    return that.batch.items.then(function (items) {
      return $.when.apply(null,
          _.chain(items)
              .filter(function (item) {
                return item.role === that.config.input.role && item.status === 'done';
              })
              .map(function (item) {
                return that.cache.fetchResourcePromiseFromUUID(item.uuid)
                    .then(function (resource) {
                      inputs.push(resource);
                    });
              })
              .value());
    })
        .then(function () {
          return that.inputs.resolve(inputs);
        }).fail(that.inputs.reject);
  }

  return Model;
});
