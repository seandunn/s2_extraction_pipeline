define([], function () {
  'use strict';

  function isCellDescriptor (item){
    return item["columnName"] !== undefined;
  }

  function extractorGenerator (cellDescriptor){
    return function(rowData){
      // Use of toUpperCase() to make camparison that is not case sensitive
      var value = rowData[cellDescriptor["columnName"].toUpperCase()] || cellDescriptor["default"];
      switch (cellDescriptor.type) {
        case "int":
          return parseInt(value);
        case "float":
          return parseFloat(value);
        case "boolean":
          return value === 'true';
        default:
          return value;
      }
    }
  }

  function createExtractorMap (data){
    return _.reduce(data, function(memo, value, key){
      memo[key] = isCellDescriptor(value) ? extractorGenerator(value) : createExtractorMap(value);
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