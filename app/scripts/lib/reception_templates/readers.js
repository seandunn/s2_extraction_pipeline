define([], function() {
  // These functions deal with pairing the details from the manifest with the sample UUID in the
  // resource passed.  In the case of the tube it can be assumed tht the first aliquot is the one
  // we're after; in the case of a plate we look at the well at the location specified in the
  // manifest details.
  return {
    tube: function() {
      return {
        extractor: tubeLikeExtractor,
        builder:   tubeRow
      };
    },

    plate: function() {
      return {
        extractor: plateLikeExtractor('wells'),
        builder:   plateRow
      };
    }
  };

  function tubeRow(row) {
    return {
      row:      row,
      barcode:  row['Tube Barcode'],
      sample:   row['SANGER SAMPLE ID'],
      resource: undefined,
      errors:   []
    };
  }
  function plateRow(row) {
    return {
      row:      row,
      barcode:  row['Plate Barcode'],
      sample:   row['SANGER SAMPLE ID'],
      resource: undefined,
      errors:   []
    };
  }

  function tubeLikeExtractor(container, details) {
    return container.aliquots;
  }

  function plateLikeExtractor(receptacles) {
    return function(container, details) {
      return container[receptacles][details.row['Location']];
    };
  }
});
