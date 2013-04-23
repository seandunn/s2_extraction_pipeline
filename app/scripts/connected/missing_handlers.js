define([
  'mapper/support/deferred'
], function(Deferred) {
  'use strict';

  var handlers = {
    // Reports the missing barcode, nothing more
    report: function(cache, barcode) {
      return $.Deferred().reject('Barcode "' + barcode + '" not found');
    },

    // Creates an instance of the appropriate labware
    create: function(cache, barcode) {
      return this.owner.getS2Root().then(function(root) {
        var labwareModel = root.tubes;

        return Deferred.sequentially(function(state) {
          return labwareModel.create({});
        }, function(state, labware) {
          state.labware = labware;
          return labware.labelWith({
            'barcode': { 'type': 'ean13-barcode', 'value': barcode }
          });
        }, function(state) {
          return root.find(state.labware.uuid);
        }, function(state, labware_with_labels) {
          state.labware = labware_with_labels;
        });
      }).then(function(state) {
        return state.labware;
      }, function() {
        return 'Unable to register labware with barcode "' + barcode + '"';
      });
    },

    // Finds an instance of the appropriate labware in the system
    find: function(cache, barcode) {
      return this.owner.getS2Root().then(function(root) {
        var labwareModel = root.tubes;

        return labwareModel.findByEan13Barcode(barcode);
      }).then(function(labware) {
        return labware;
      }, function() {
        return 'Unable to find labware with barcode "' + barcode + '"';
      });
    },

    // Composite behaviour: find it, if it can't be found create it.
    composite: function(cache, barcode) {
      var owner = this;
      return handlers.find.apply(owner, [cache, barcode]).then(function(labware) {
        return labware;
      }, function() {
        return handlers.create.apply(owner, [cache, barcode]);
      });
    }
  };

  return function(name) {
    return handlers[name];
  };
});
