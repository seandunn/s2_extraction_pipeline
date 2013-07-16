define([
  'config',
  'mapper_services/print',
  'extraction_pipeline/connected/caching'
], function (config, PrintService, Cache) {

  'use strict';

  var BasePageModel = Object.create(null);

  $.extend(BasePageModel, {
    initialiseCaching: function() {
      var model = this;
      this.cache = _.extend(Cache.init(), {
        fetchResourcePromiseFromUUID:function (uuid) {
          return this.get(
            function(r) { return r.uuid === uuid; },
            _.bind(findByUuid, model, uuid)
          );
        },
        fetchResourcePromiseFromBarcode:function (barcode, labwareModel) {
          return this.get(
            function(r) { return r.labels && r.labels.barcode.value === barcode; },
            _.bind(findByBarcode(labwareModel), model, barcode)
          );
        }
      });
      this.cache.resolve([]);
    },

    printBarcodes:function(collection, printerName) {
      var that = this;

      var printer = _.find(PrintService.printers, function(printer){
        return printer.name === printerName;
      });

      // Extract the print label details from each item in the collection
      var printItems = _.invoke(collection, 'returnPrintDetails');

      return printer.print(printItems, {
        user: this.user
      }).done(function() {
        //TODO: remove guard code when childDone has been removed
        if(that.owner && that.owner.childDone){
          that.owner.childDone(that, 'barcodePrintSuccess', {});
        }
      }).fail(function() {
        //TODO: remove guard code when childDone has been removed
        if(that.owner && that.owner.childDone){
          that.owner.childDone(that, 'barcodePrintFailure', {});
        }
      });
    }
  });

  return BasePageModel;

  // Methods for finding things based on the UUID or barcode
  function findByUuid(uuid) {
    return this.owner.getS2Root().then(function(root) {
      return root.find(uuid);
    });
  }

  function findByBarcode(labwareModel) {
    labwareModel = labwareModel || "tubes";
   return function (barcode) {
    // a bit horrible, but it works for now.
    // because of the nature of the promise, we can NOT chain them
    // indeed, if one of the search fails (as in empty), the whole chain
    // of promise as failed, and all the remaining 'fail' callbacks will be triggered
    // To avoid this, we do not chain them, but create a promise (spin_columns.findBy())
    // and respond to this isolated promise, inside the failure callback of 'tube.findBy()'...
    // Then, we resolve the 'global' promise by side effect...

    // Possible to avoid this:
    // empty search doesn't fail, but returns undefined. (=> must change the code to handle this new behaviour in several places in the code)
    var deferred = $.Deferred();
    var root;
    this.owner.getS2Root()
        .then(function (result) {
          root = result;
          var labware;
          root[labwareModel].findByEan13Barcode(barcode)
              .then(function (result) {
                labware = result;
                return deferred.resolve(result);
              })
              .fail(function () {
                root.spin_columns.findByEan13Barcode(barcode)
                    .then(function (result) {
                      labware = result;
                      return deferred.resolve(result);
                    })
                    .fail(function (result) {
                      return deferred.reject();
                    })
              })
        });

    return deferred.promise();
   }
  }
});
