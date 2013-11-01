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
        extractor: plateLikeExtractor('wells'),
        builder:   _.partial(row, "Plate Barcode", "Plate Barcode", "barcode"),
        searcher:  searchUsingEAN13
      };
    },

    filter_paper: function() {
      return {
        extractor: filterPaperExtractor,
        builder:   _.partial(row, "Barcode", "SANGER SAMPLE ID", "identifier"),
        searcher:  searchForFilterPaper
      };
    }
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

  // Filter papers have the same sample in both locations, so it really doesn't matter which one we
  // pick here!
  function filterPaperExtractor(container, details) {
    return container.locations["A1"];
  }

  // When searching for filter paper we actually use the customised label that holds the sanger
  // sample ID.  Remember that at the point this search is performed the filter paper barcode is
  // actually unknown!
  function searchForFilterPaper(model, sangerSampleIds) {
    return model.searchByIdentifier().labelled("text", sangerSampleIds);
  }
});
