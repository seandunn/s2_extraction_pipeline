define([], function() {
  // These functions deal with pairing the details from the manifest with the sample UUID in the
  // resource passed.  In the case of the tube it can be assumed tht the first aliquot is the one
  // we're after; in the case of a plate we look at the well at the location specified in the
  // manifest details.
  return {
    tube: function() {
      return {
        extractor: tubeLikeExtractor,
        builder:   _.partial(row, "Tube Barcode", "Tube Barcode", "barcode"),
        searcher:  searchUsingEAN13
      };
    },

    plate: function() {
      return {
        extractor: plateLikeExtractor("wells"),
        builder:   _.partial(row, "Plate Barcode", "Plate Barcode", "barcode"),
        searcher:  searchUsingEAN13
      };
    },

    filter_paper: function() {
      return {
        extractor: tubeLikeExtractor,
        builder:   _.partial(row, "Barcode", "Barcode", "barcode"),
        searcher:  searchUsingEAN13
      };
    },

    vial: function() { return {} }
  };

  function row(barcodeColumn, labelColumn, resourceLabel, row) {
    return {
      row:      row,
      barcode:  row[barcodeColumn],
      sample:   row['SANGER SAMPLE ID'],
      resource: undefined,
      errors:   [],
      label: {
        column: resourceLabel,
        value:  row[labelColumn]
      }
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

  function searchUsingEAN13(model, barcodes) {
    return model.searchByBarcode().ean13(barcodes);
  }

});
