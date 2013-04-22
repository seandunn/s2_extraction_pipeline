define([], function() {
  'use strict';
  return {
    csvToArray:function(data){
      var delimiter = ',';

      var lines = data.split(/\r\n|\r|\n/g);

      var re = new RegExp(
          "\\s*(\\w+\\d+)\\s*\\"+delimiter
          +
          "\\s*\\\"(\\w+)\\\"","i")



      var array = [];
      var matches = undefined;

      _.each(lines,function(line){
        matches = re.exec(line);
        var location = matches[1];
        var barcode = matches[2];
        array.push([location,barcode]);
      });

      return array;
    },
    locationArrayToLocalisedResources:function(array){
      _.each(array,function(row){
        _.each(row,function(col){
          if (col === "MISREAD"){
            throw "one row is malformed : "+row
          }
        });
      });

      return {};
    },
    convertCSVDataToJSON:function(data){
      return this.locationArrayToLocalisedResources(this.csvToArray(data));
    }

  };
});
