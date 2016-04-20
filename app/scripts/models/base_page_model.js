//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
        "event_emitter",
  'mapper_services/print',
  'connected/caching'
], function (EventEmitter, PrintService, Cache) {

  'use strict';

  var BasePageModel = new EventEmitter();
  
  _.extend(BasePageModel, {
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

    fetchResource: function() {
      return this.cache.fetchResourcePromiseFromUUID(this.uuid);
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
        that.emit('barcodePrintSuccess', {});
      }).fail(function() {
        that.emit('barcodePrintFailure', {});
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

  function findByBarcode() {
    return function (barcode) {
      return this.owner.getS2Root().then(function (root) {
        return root.findByLabEan13(barcode).fail(function () {
          return "Labware labellabled: "+barcode+" can't be found on S2."
        });
      });

    }
  }
});
