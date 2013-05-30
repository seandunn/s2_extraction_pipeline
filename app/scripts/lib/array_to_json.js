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
    },

    containsDecorator:function(data, decorator){
      // here, we want to return a boolean, not an undefined if not found
      return findDecorator(data, decorator) !== undefined;
      function findDecorator(data, decorator){
        return _.find(data, function(value){
          if($.isPlainObject(value)){
            return findDecorator(value, decorator);
          }
          else {
            if(!isString(value)) return false;
            return value.indexOf(decorator) !== -1;
          }
          function isString(o) {
            return typeof o == "string" || (typeof o == "object" && o.constructor === String);
          }
        });
      }
    }
  };
});