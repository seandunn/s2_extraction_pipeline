define([], function() {
  // Maps from the resource type to the appropriate default mapping.  At the moment we only
  // need to map the plate because this has the improve view behaviour.
  var labwareToPresenter = {
    plate: function(plate) {
      return {
        resourceType: plate.resourceType,
        wells: _.chain(plate.wells).map(function(a,l) { return [l, (a.length==0) ? "empty" : "full"]; }).object().value(),
        number_of_rows: plate.number_of_rows,
        number_of_columns: plate.number_of_columns,
        barcode: plate.labels.barcode.value
      };
    }
  };

  // This is a mixin for classes that wish to do labware presentation.
  return {
    presentResource: function(resource, callback) {
      if (_.isUndefined(resource)) return;

      var presenter = labwareToPresenter[resource.resourceType] || _.identity;
      callback(presenter(resource));
    }
  };
});
