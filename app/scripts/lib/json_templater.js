define([], function () {
  'use strict';

  return {
    combineHeadersToData: function (columnNames, data, decorator) {
      decorator = decorator || "";
      var combinedArray = [];
      _.each(data, function (row) {
        var combinedObject = {};
        _.each(columnNames, function (columnName, columnIndex) {
          combinedObject[(decorator+columnName)] = row[columnIndex];
        });
        combinedArray.push(combinedObject);
      });
      return combinedArray;
    },

    applicator: function(template) {
      var extractorMap = createExtractorMap(template);
      var extractor    = _.partial(extractRowData, extractorMap);
      return _.compose(extractor, upperCaseRowKeys);
    },

    applyTemplateToDataSet: function (dataSet, template) {
      return _.map(dataSet, this.applicator(template));
    }
  };

  function upperCaseRowKeys(row) {
    return _.chain(row).map(upperCaseKey).object().value();
  }
  function upperCaseKey(value, key) {
    return [key.toUpperCase(),value];
  }
  function extractRowData(extractorMap, rowData) {
    return _.reduce(extractorMap, function(memo, extractor, key) {
      memo[key] = extractor(rowData);
      return memo;
    },{});
  }

  function isCellDescriptor (item){
    return item["columnName"] !== undefined;
  }

  function extractorGenerator (cellDescriptor){
    var converter = converterFor(cellDescriptor);
    var column    = cellDescriptor.columnName.toUpperCase();

    return function(rowData) {
      var value = rowData[column] || cellDescriptor["default"];
      return converter(value);
    }
  }

  function createExtractorMap (data){
    return _.reduce(data, function(memo, value, key){
      var handler = undefined;

      if (isCellDescriptor(value)){
        handler = extractorGenerator(value);
      } else if ($.isPlainObject(value)) {
        handler = _.partial(extractRowData, createExtractorMap(value));
      } else {
        handler = memoize(value);
      }

      memo[key] = handler;
      return memo;
    },{});
  }

  function memoize(value) {
    return function() {
      return value;
    };
  }

  /*
   * Converters.  These take a string value and give you an appropriate representation of it.
   */
  function intConverter(value) {
    value = parseInt(value, 10);
    return isNaN(value) ? undefined : value;
  }
  function booleanConverter(value) {
    var upped = (value || 'NO').toUpperCase();
    return (upped === 'YES') || (upped === 'TRUE') || (upped === 'Y');
  }
  function selectConverter(cellDescriptor, value) {
    return $.extend({}, cellDescriptor, {value:value});
  }
  function converterFor(cellDescriptor) {
    switch (cellDescriptor.type) {
      // used to return plain values
      case "int":     return intConverter; break;
      case "float":   return parseFloat; break;
      case "boolean": return booleanConverter; break;

      // used to generate html nodes
      case "select":   return _.partial(selectConverter, cellDescriptor); break;
      case "span":     return _.partial(selectConverter, cellDescriptor); break;
      case "checkbox": return _.compose(_.partial(selectConverter, cellDescriptor), booleanConverter); break;

      default: return _.identity; break;
    }
  }
});
