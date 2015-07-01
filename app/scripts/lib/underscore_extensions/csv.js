//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'lib/underscore_extensions/functional'
], function(Functional) {
  'use strict';

  return {
    // Converts the given tabular data into a CSV file using the given separator.
    toCSV: function(table, separator) {
      return _.chain(table)
              .map(Functional.mapper(stringify))
              .map(Functional.mapper(_.partial(quote, separator)))
              .map(_.partial(join, separator))
              .value()
              .join("\n");
    },

    // Given a string this file splits it on `\n` to get the lines, and then splits those lines
    // using the given separator to get an array representing the row.  Empty rows at the end
    // of the parsed result are dropped.
    parseAsSeparatedRows: function(string, separator) {
      // Stateful reduce function that will drop empty lines
      var reducer = function(memo, value) {
        if (isLineEmpty(value)) { return memo; }
        reducer = function(memo, value) { memo.unshift(value); return memo; }
        return reducer(memo, value);
      };

      return _.chain(string.split(/\r?\n|\r/))
              .map(_.partial(split, separator))
              .plus(mergeQuotedFields)
              .map(Functional.mapper(trim))
              .map(Functional.mapper(unquote))
              .reduceRight(function(m,v) { return reducer(m,v); }, [])
              .value();

      function isLineEmpty(line) {
        return _.reduce(line, function(t,v) { return t + v.length; }, 0) == 0;
      }

      // Because of the way we have split the row using the separator we may have split quoted
      // fields, so we need to merge those back together.  Unfortunately this requires a bit of
      // a statemachine to deal with that.
      function mergeQuotedFields(row) {
        return _.reduce(
          row,
          function(context, value) { return context.state(context, value); },
          { state: waitingQuoteStart, output: [], field: null }
        ).output;

        function waitingQuoteStart(context, value) {
          if ((value[0] == "\"") && (value[value.length-1] != "\"")) {
            context.state = waitingQuoteEnd;
            context.field = value;
            return context;
          } else {
            context.output.push(value);
            return context;
          }
        }
        function waitingQuoteEnd(context, value) {
          var field = context.field + separator + value;
          if (value[value.length-1] != "\"") {
            context.field = field;
            return context;
          } else {
            context.output.push(field);
            context.state = waitingQuoteStart;
            context.field = undefined;
            return context;
          }
        }
      }
    }
  };

  function split(separator, string) {
    return string.split(separator);
  }
  function join(separator, array) {
    return array.join(separator);
  }
  function trim(value) {
    return value.trim();
  }
  function stringify(field) {
    return "" + field;
  }
  function quote(separator, field) {
    return (field.indexOf(separator) == -1) ? field : "\"" + field + "\"";
  }
  function unquote(v) {
    return ((v[0] == "\"") && (v[v.length-1] == "\"")) ? v.substring(1, v.length-1) : v;
  }
});
