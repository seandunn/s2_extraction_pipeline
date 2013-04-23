define([
  'mapper/support/deferred'
], function(Deferred) {
  'use strict';

  var handlers = {
    // Reports the missing barcode, nothing more
    report: function(modelName, barcode) {
      return $.Deferred().reject('Barcode "' + barcode + '" not found');
    },

    // Creates an instance of the appropriate labware
    create: function(modelName, barcode) {
      return this.owner.getS2Root().then(function(root) {
        var labwareModel = root[modelName];

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
    find: function(modelName, barcode) {
      return this.owner.getS2Root().then(function(root) {
        return root[modelName].findByEan13Barcode(barcode);
      }).then(function(labware) {
        return labware;
      }, function() {
        return 'Unable to find labware with barcode "' + barcode + '"';
      });
    },

    // Composite behaviour: find it, if it can't be found create it.
    composite: function() {
      var owner = this;
      return handlers.find.apply(owner, arguments).then(function(labware) {
        return labware;
      }, function() {
        return handlers.create.apply(owner, arguments);
      });
    }
  };

  return function(name) {
    return handlers[name];
  };
});
