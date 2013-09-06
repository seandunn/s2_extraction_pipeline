define(['config'
, 'lib/barcode_checker'
, 'lib/util'
], function (appConfig, BarcodeChecker, Util) {
  'use strict';

  var BaseController = Object.create(null);

  $.extend(BaseController, {
    // This should be registered with model not controller
    getS2Root: function(user) { return this.owner.getS2Root(user); },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    bindReturnKey: function (element, successCallback, errorCallback, validationCallback) {
      var thisController = this;

      function setScannerTimeout(barcodeSelection){
        setTimeout(function () {
          barcodeSelection.val('');
        }, 250);
      }

      var validation = validationCallback || function (element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) return;

          var value = event.currentTarget.value;
          var barcodeSelection = $(event.currentTarget);
          setScannerTimeout(barcodeSelection);

          if (_.some(BarcodeChecker, function (validationCallback) {
            return validationCallback(Util.pad(value));
          })) {
            callback(value, element, thisController);
          } else {
            errorCallback(value, element, thisController);
          }
        }
      };

      return element.on("keypress", "input", validation(element, successCallback, errorCallback) );
    },

    printerList: function(workflowConfig) {
      return appConfig.printers.filter(function(printer){
        return printer.type === workflowConfig.printerType;
      });
    }
  });

  return BaseController;
});
