define([], function () {
  'use strict';
  return {
    rackingCsvToArray:function (data) {
      var delimiter = ',';

      var lines = data.split(/\r\n|\r|\n/g);

      var re = new RegExp(
          "\\s*(\\w)(\\d\\d)\\s*\\" + delimiter
              +
              "\\s*(FR\\d+).*", "i");  // TODO: add the 'FR' prefix to the regex

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

    volumeCsvToArray:function (data) {
      var delimiter = ',';

      var lines = data.split(/\r\n|\r|\n/g);

      var re = new RegExp(
          "\\s*(\\d+)\\s*" // the barcode
              + delimiter +
              "\\s*(\\w)(\\d\\d)\\s*\\" // the location
              + delimiter +
              "\\s*([\\d\\.\\,]+).*" // the volume
          , "i");  // TODO: add the 'FR' prefix to the regex

      var array = [];
      var matches = undefined;
      var rack_barcode ;

      _.chain(lines).drop(0).each(function (line) {
        matches = re.exec(line);
        if(matches){
          rack_barcode = rack_barcode || matches[1];
          if (rack_barcode != matches[1]) {
            throw new Error('...');
          }
          var locationLetter = matches[2];
          var locationNumber = parseInt(matches[3]);
          var volume = parseFloat(matches[4]);
          array.push([locationLetter+locationNumber, volume]);
        }
      });

      return {rack_barcode:rack_barcode,array:array};
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
      return this.locationArrayToLocalisedBarcodes(this.rackingCsvToArray(data));
    }

  };
});
