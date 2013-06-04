define([], function () {
  'use strict';

  return {
    combineHeadersToData: function (columnNames, data, decorator) {
      decorator = decorator || "";
      var combinedArray = [];
      _.each(data, function (row) {
        var combinedObject = {};
        _.each(columnNames, function (columnName, columnIndex) {
          combinedObject[decorator+columnName] = row[columnIndex];
        });
        combinedArray.push(combinedObject);
      });
      return combinedArray;
    },

    arrayToJSON: function (data, template) {
      return _.map(data, function (row) {
        return rowToJson(row, template);
      });
      function rowToJson(data, template) {
        var returnValue = $.extend({}, template);
        _.each(template, function (value, key) {
          if ($.isPlainObject(value)) {
            returnValue[key] = rowToJson(data, value);
          } else {
            returnValue[key] = data[value] || value;
          }
        });
        return returnValue;
      }
    }
  };
});