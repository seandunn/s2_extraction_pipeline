define([], function () {
  'use strict';
  return {
    csvToArray:function (data) {
      var delimiter = ',';

      var lines = data.split(/\r\n|\r|\n/g);

      var re = new RegExp(
          "\\s*(\\w+\\d+)\\s*\\" + delimiter
              +
              "\\s*\\\"(FR\\w+)\\\"", "i")

      var array = [];
      var matches = undefined;

      _.each(lines, function (line) {
        matches = re.exec(line);
        var location = matches[1];
        var barcode = matches[2];
        array.push([location, barcode]);
      });

      return array;
    },
    locationArrayToLocalisedBarcodes:function (array) {
      var output = {};
      _.each(array, function (row) {
        var location = row[0]
        var barcode = row[1]
        if (barcode === "Not read") {
          // does nothing
        } else {
          output[location] = {
            "barcode":barcode
          }
        }
      });

      return output;
    },
    getRequestParamForMultipleBarcodeSearch:function (root,barcodeHash) {
      var parser = this;
      var wholePromise = $.Deferred();
      var dataArray = {};

      var barcodes = _.reduce(barcodeHash,function(memo,barcode){
        return memo.push(barcode);
      });



//      var array = _.map(barcodeHash, function (details, location) {
//        var promise = $.Deferred();
//        parser.getUUIDsByBarcodesPromise(root, details.barcode)
//            .then(function (uuid) {
//              dataArray[location]={
//                "barcode":details.barcode,
//                "uuid":uuid
//              };
//              promise.resolve();
//            }).fail(function () {
//              promise.reject();
//            });
//
//        return promise.promise();
//      });
//
//      $.when.apply(null,array).then(function(){
//        wholePromise.resolve(dataArray);
//      }).fail(wholePromise.reject);

      return wholePromise.promise();
    },
    getUUIDsByBarcodesPromise:function (root, barcodes) {


//      return root.labellables.findByEan13Barcode(barcodes)
//          .then(function (label) {
//            return label.name;
//          });

    },
    convertCSVDataToJSON:function (data) {
      return this.locationArrayToLocalisedBarcodes(this.csvToArray(data));
    }

  };
});
