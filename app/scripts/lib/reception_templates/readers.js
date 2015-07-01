//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013-2015,2014 Genome Research Ltd.
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
    /**
     * TODO: This task should be inside manifest_merge_service. This temporal fix should be removed and
     * applied there.
     * 
     * The manifest.xls content is not congruent with the bulk_create_barcode response. If the barcode
     * generated is less than 13 characters, bulk_create_barcode returns a padded barcode with zeros 
     * at the beginning but the manifest don't have this padding in its barcodes. Because of this, 
     * our subsequent label searching will fail because they are different to the database padded 
     * content. In the app we will see the message: "Cannot find these details in the system".
     * This is a problem in the content inside the manifest.xls, as every barcode inside it must be 
     * strictly equal to the response of bulk_create_barcode. 
     **/    
    return model.searchByBarcode().ean13(_.map(barcodes, _.partial(padLeft, "0", 13)));
  }

  function padLeft(padding, length, input) {
    var result = input;
    
    var padLength = length - input.length;
    for (var i = 0; i < padLength; i++) {
      result = padding + result;
    }
    
    return result;
  }
    
});
