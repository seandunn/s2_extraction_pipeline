define([
  'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var DefaultPageModel = Object.create(BasePageModel);


  $.extend(DefaultPageModel, {
    init:function (owner) {
      this.owner = Object.create(owner);
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;

      this.initialiseCaching();
      return this;
    },
    setLabware:function (rsc) {
      this.labware = rsc;
      this.owner.childDone(this, "modelUpdated", rsc);
      this.checkIfModelIsValid();
    },
    setUser:function (rsc) {
      this.user = rsc;
      this.owner.childDone(this, "modelUpdated", rsc);
      this.checkIfModelIsValid();
    },
    setLabwareFromBarcode:function (barcode) {
      var that = this;
      return this.cache.fetchResourcePromiseFromBarcode(barcode)
          .then(function (rsc) {
            that.setLabware(rsc);
          })
          .fail(function(){
            //todo: handle error
          });
    },
    setUserFromBarcode:function (barcode) {
      this.setUser(barcode);
    },
    checkIfModelIsValid:function () {
      if (this.user && this.labware) {
        // get the batch...
        var that = this;
        var dataForOwner;
        this.labware.order()
            .then(function (order) {
              return order.batchFor(function (item) {
                return item.uuid === that.labware.uuid;
              });
            })
            .then(function (batch) {
              console.log("batch found :", batch );
              that.batch = batch;
              that.owner.childDone(that, "modelValidated");
            })
            .fail(function () {
              console.log("batch not found :");
              that.batch = null;

              // we still inform the owner that this is a valid model, even if we don't have batch
              that.owner.childDone(that, "modelValidated");
            });
      }
    }
  });

  return DefaultPageModel;
});
