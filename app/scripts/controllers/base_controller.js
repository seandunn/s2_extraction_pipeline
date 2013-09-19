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

    onBarcodeScanned: function() {
    },

    bindReturnKey: function (element, successCallback, errorCallback, validationCallback) {
      var thisController = this;

      function setScannerTimeout(barcodeSelection){
        setTimeout(function () {
          barcodeSelection.val('');
        }, 250);
      }

      var validation = validationCallback || function (element, callback, errorCallback) {

	  var RETURN_KEYCODE=13, SIZE_LABEL=13;

        return function (event) {
          var value = event.currentTarget.value;
	  if ((value.length!==SIZE_LABEL) && (event.which !== RETURN_KEYCODE))
	      return;

          var barcodeSelection = $(event.currentTarget);
          setScannerTimeout(barcodeSelection);

          if (_.some(BarcodeChecker, function (validationCallback) {
            return validationCallback(Util.pad(value));
          })) {
            callback(value, element, thisController);
	    controller.onBarcodeScanned();
          } else {
            errorCallback(value, element, thisController);
          }
        }
      };

      element.on("keyup", "input", validation(element, successCallback, errorCallback));
      return element.on("keypress", "input", validation(element, successCallback, errorCallback) );
    },

    printerList: function(workflowConfig) {
      return appConfig.printers.filter(function(printer){
        return printer.type === workflowConfig.printerType;
      });
    },

    startProcess: function(f) {
      var controller = this;
      return _.wrap(f, function(func) {
        controller.view.trigger("s2.busybox.start_process");
        return func.apply(undefined, _.drop(arguments, 1));
      });
    },

    finishProcess: function(f) {
      var controller = this;
      return _.wrap(f, function(func) {
        var rc = func.apply(undefined, _.drop(arguments, 1));
        controller.view.trigger("s2.busybox.end_process");
        return rc;
      });
    }
  });

  return BaseController;
});
