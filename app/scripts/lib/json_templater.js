define([], function () {
  'use strict';

  function isCellDescriptor (item){
    return item["columnName"] !== undefined;
  }

  function extractorGenerator (cellDescriptor){
    return function(rowData){
      // Use of toUpperCase() to make camparison that is not case sensitive
      var value = rowData[cellDescriptor["columnName"].toUpperCase()] || cellDescriptor["default"];
      if (!value) return; // if there's no value, no need to check the type and try to parse.
      switch (cellDescriptor.type) {
        // used to return plain values
        case "int":
          value = parseInt(value, 10);
          return isNaN(value) ? undefined : value;
        case "float":
          return parseFloat(value);
        case "boolean":
          return ( value.toUpperCase() === 'YES' ) || ( value.toUpperCase() === 'TRUE' );
        // used to generate html nodes
        case "select":
          return $.extend({}, cellDescriptor, {value:value} );
        case "span":
          return $.extend({}, cellDescriptor, {value:value} );
        case "checkbox":
          return $.extend({},
              cellDescriptor,
              { value: ( value.toUpperCase() === 'YES' ) || ( value.toUpperCase() === 'TRUE' ) }
          );
        default:
          return value;
      }
    }
  }

  function createExtractorMap (data){
    return _.reduce(data, function(memo, value, key){
      if (isCellDescriptor(value)){
        memo[key] = extractorGenerator(value);
      } else if ($.isPlainObject(value)) {
        memo[key] = createExtractorMap(value);
      } else {
        memo[key] = function(rowData) {return value};
      }
            return memo;
    },{});
  }

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

    applyTemplateToDataSet: function (dataSet, template) {
      // Done to make comparison that is not case sensitive
      var capitalisedDataSet = _.map(dataSet, function(data) {
        return _.reduce(data,function(memo, value, key){
          memo[key.toUpperCase()] = value;
          return memo;
        },{});
      } );
      return _.map(capitalisedDataSet, function (rowData) {
        return extractRowData(rowData, createExtractorMap(template));
      });

      function extractRowData(rowData, extractorMap) {
        return _.reduce(extractorMap, function (memo, valueExtractor, key) {
          memo[key] = _.isFunction(valueExtractor) ? valueExtractor(rowData) : extractRowData(rowData, valueExtractor);
          return memo;
        },{});
      }
    }
  };
});