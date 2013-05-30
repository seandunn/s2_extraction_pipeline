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
        fetchResourcePromiseFromBarcode:function (barcode) {
          return this.get(
            function(r) { return r.labels && r.labels.barcode.value === barcode; },
            _.bind(findByBarcode, model, barcode)
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
      var printItems = _.map(collection, function(item) {
        return item.returnPrintDetails();
      });

      return printer.print(printItems, {user:this.user})
          .done(function() {
            that.owner.childDone(that, 'barcodePrintSuccess', {});
          })
          .fail(function() {
            that.owner.childDone(that, 'barcodePrintFailure', {});
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
  function findByBarcode(barcode) {
    return this.owner.getS2Root().then(function(root) {
      return root.tubes.findByEan13Barcode(barcode);
    });
  }
});
