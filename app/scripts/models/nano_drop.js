define([
  'models/base_page_model',
  'lib/file_handling/nano_drop'
], function(BasePageModel, FileHandling, PubSub) {
  'use strict';

  var mapToUpdate = _.partial(_.restructure, {
    "sample_uuid":     "Sample ID",
    "out-of-band": {
      "Concentration": "Conc.",
      "260/280":       "260/280",
      "260/230":       "260/230"
    }
  });

  return _.extend(Object.create(BasePageModel), {
    init: function(owner, config, inputModel) {
      this.owner   = owner;
      this.config  = config;
      this.rack    = inputModel.initialLabware;
      this.plate   = this.rack;
      this.updates = undefined;

      this.initialiseCaching();
      _.extend(this, inputModel);
      return this;
    },

    analyseFileContent: function(data) {
      var deferred      = $.Deferred();
      var parsed        = FileHandling.from(data);
      var parsedBarcode = _.keys(parsed)[0];
      if (parsedBarcode != this.plate.labels.barcode.value) {
        deferred.reject("The scanned plate barcode '" + this.plate.labels.barcode.value + "' " +
                        "does not match the file barcode of '" + parsedBarcode + "'");
      } else {
        this.updates = parsed[parsedBarcode];
        deferred.resolve(this.updates);
      }
      return deferred.promise();
    },

    save: function() {
      // Create the update information ahead of time because it's static
      var orderUpdate = {items:{}};
      orderUpdate.items[this.config.input.role] = {};
      orderUpdate.items[this.config.input.role][this.plate.uuid] = {event:"unuse"};
      orderUpdate.items[this.config.output[0].role] = {};
      orderUpdate.items[this.config.output[0].role][this.plate.uuid] = {event:"complete"};

      // Remap the file information to the appropriate updates
      var updates =
        _.chain(this.updates)
         .map(function(value, key) { return [key,mapToUpdate(value)]; })
         .object()
         .value();

      return
        this.plate
            .update({plate:{wells:updates}})
            .then(function(plate) {
              return plate.orders();
            }, function() {
              return "Unable to update information for plate.";
            }).then(function(orders) {
              return $.when.apply(undefined, _.map(orders, function(order) {
                return order.update(orderUpdate);
              }));
            }, function() {
              return "Unable to retrieve the orders associated with the plate.";
            })
            .then(function() {
              return "NanoDrop information complete.";
            }, function() {
              return "Unable to update orders containing the plate.";
            });
    }
  });
});
