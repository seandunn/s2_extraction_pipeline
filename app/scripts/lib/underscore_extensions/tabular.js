//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  return {
    // Takes takes an array of arrays representing a tabular data structure and turns it into an
    // array of objects.  The first element of the `table` data is assumed to be the headers which
    // then become the attributes of the objects created.  The row data is assumed to be in the
    // same order as the table headers.
    untabularize: function(table) {
      return _.chain(table)
              .rest()
              .map(_.partial(_.object, table[0]))
              .value();
    },

    // Takes an array of objects and a list of headers, this function returns a tabular data
    // structure: an array of arrays, the first element of the main array being an array of the
    // headers.
    tabularize: function(objects, headers) {
      var tabular = _.map(objects, objectToArray);
      tabular.unshift(headers);
      return tabular;

      function objectToArray(object) {
        return _.map(headers, function(k) { return object[k]; });
      }
    }
  };
});
