define([
  'extraction_pipeline/models/base_page_model'
], function(BasePageModel) {

  'use strict';

  var BindingCompleteModel = Object.create(BasePageModel);

  $.extend(BindingCompleteModel, {
    //TODO: add suitable methods for the model

    init:function (owner) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.tubes = [];
      return this;
    },
    setBatch:function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.dirtySetTubes(); // as in: from the batch, I get the tubes involved...
      this.owner.childDone(this, "batchAdded");
    },
    makeTransfer:function(source,destination_SC_BR){
      var root, that = this;
      var spinColumn;
      this.owner.getS2Root()
        .then(function(r){
          root = r;
          // creates sc with the given BC
          return SC.creates();
//          return {}; //...
        })
        .then(function(sc){
          spinColumn = sc;

          return root.tube_spin_column_transfers.new({"source":source, "destination":sc});
        })
        .then(function(){
          return source.order();
        })
        .then(function(ord){
          return ord.updateRole(source,{event:"complete"});
        })
        .then(function(ord){
          return ord.updateRole(spinColumn,{event:"complete"});
        })
        .then(function(){
          that.owner.childDone(that,"modelUpdated", {});
        })
        .fail(function(){
          // ...
        });
    },
    dirtySetTubes:function(){
      var that = this;
      this.fetchResourcePromiseFromBarcode("XX111111K")
        .then(function (rsc) {
          that.tubes.push(rsc);
          that.tubes.push(rsc);
          that.tubes.push(rsc);
          that.tubes.push(rsc);
        });
    }
  });

  return BindingCompleteModel;

})
