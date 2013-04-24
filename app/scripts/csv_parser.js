define([], function () {
  'use strict';
  return {
    csvToArray:function (data) {
      var delimiter = ',';

      var lines = data.split(/\r\n|\r|\n/g);

      var re = new RegExp(
          "\\s*(\\w)(\\d\\d)\\s*\\" + delimiter
              +
              "\\s*(\\d+).*", "i");  // TODO: add the 'FR' prefix to the regex

      var array = [];
      var matches = undefined;

      _.each(lines, function (line) {
        matches = re.exec(line);
        if(matches){
          var locationLetter = matches[1];
          var locationNumber = parseInt(matches[2]);
          var barcode = matches[3];
            array.push([locationLetter+locationNumber, barcode]);
        }
      });

      return array;
    },
    locationArrayToLocalisedBarcodes:function (array) {
      var output = {};
      _.each(array, function (row) {
        var location = row[0];
        var barcode = row[1];
        output[barcode] = location;
      });
      return output;
    },
    convertCSVDataToJSON:function (data) {
      return this.locationArrayToLocalisedBarcodes(this.csvToArray(data));
    }

  };
});
