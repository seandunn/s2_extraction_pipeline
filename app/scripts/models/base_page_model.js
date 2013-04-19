define(['config'
        ,'mapper_services/print'
], function (config, PrintService) {

  'use strict';

  var BasePageModel = Object.create(null);

  $.extend(BasePageModel, {
    initialiseCaching: function() {
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
    },

    // Stashing for caching
    stash: function(resource, barcode) {
      this.stash_by_BC[barcode]         = resource;
      this.stash_by_UUID[resource.uuid] = resource;
    },

    addResource:function (resource) {
      if (!resource) return;

      if (resource.uuid) {
        this.stash_by_UUID[resource.uuid] = resource;
      }
      if (resource.labels && resource.labels.barcode) {
        this.stash_by_BC[resource.labels.barcode.value] = resource;
      }
    },
    fetchResourcePromiseFromUUID:function (uuid) {
      return this.fetchResourcePromise({uuid:uuid});
    },
    fetchResourcePromiseFromBarcode:function (barcode) {
      return this.fetchResourcePromise({barcode:barcode});
    },
    fetchResourcePromise:function (resourceDetails) {
      var deferredS2Resource = new $.Deferred();

      var rsc, that = this;

      if (resourceDetails.uuid) {
        rsc = this.stash_by_UUID[resourceDetails.uuid];
        if (rsc) {
          return deferredS2Resource.resolve(rsc).promise();
        } else {
          this.owner.getS2Root()
              .then(function (root) {
                return root.find(resourceDetails.uuid);
              }).then(function (result) {
                rsc = result;
                that.addResource(rsc);
                deferredS2Resource.resolve(rsc);
              }).fail(function () {
                deferredS2Resource.reject();
              })
          ;
          return deferredS2Resource.promise();
        }
      }

      if (resourceDetails.barcode) {
        rsc = this.stash_by_BC[resourceDetails.barcode];
        if (rsc) {
          return deferredS2Resource.resolve(rsc).promise();
        } else {

          this.owner.getS2Root()
              .then(function (root) {
                return root.tubes.findByEan13Barcode(resourceDetails.barcode);
              }).then(function (result) {
                rsc = result;
                that.addResource(rsc);
                deferredS2Resource.resolve(rsc);
              }).fail(function () {
                deferredS2Resource.reject();
              });
        }
      }
      return deferredS2Resource.promise();
    },
    printBarcodes:function(collection) {
      var that = this;
      var printer = PrintService.printers[0];

      // Extract the print label details from each item in the collection
      var printItems = _.map(collection, function(item) {
        return item.returnPrintDetails();
      });

      return printer.print(printItems)
          .done(function() {
            that.owner.childDone(that, 'barcodePrintSuccess', {});
          })
          .fail(function() {
            that.owner.childDone(that, 'barcodePrintFailure', {});
          });
    }
  });

  return BasePageModel;
});
