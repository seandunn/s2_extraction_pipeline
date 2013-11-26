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

      return element.on("keydown", "input", buildProcessKeyInput(element, successCallback, errorCallback) );
      
      function buildProcessKeyInput(element, callback, errorCallback) {
        return function(event)
        {
          var states = {
            13: /* CR_KEY  */ processCompletedInput,
            9:  /* TAB_KEY */ processCompletedInput
          };
          return (states[event.which] || doNothing)(event);
          
          function doNothing(event) { 
            return;
          }
        
          function processCompletedInput(event)
          {
            event.preventDefault();

            var value = event.currentTarget.value;
            if (value.match(/\d{12}/))
              {
                value = Util.pad(value);
              }
            var barcodeSelection = $(event.currentTarget);
            //setScannerTimeout(barcodeSelection);

            validationCallback = validationCallback || function(barcode) { 
              return _.some(BarcodeChecker, function (validation) {
                return validation(Util.pad(value));
              });
            };
            (validationCallback(value)? callback : _.wrap(errorCallback, function(fun) {
              setScannerTimeout(barcodeSelection);
              return fun();
            }))(value, element, thisController);        
          
          }
        };
      }
    },

    printerList: function(workflowConfig) {
      return appConfig.printers.filter(function(printer){
        return printer.type === workflowConfig.printerType;
      });
    },

    startProcess: function(f) {
      var controller = this;
      return _.wrap(f, function(func) {
        controller.view.trigger("start_process.busybox.s2");
        return func.apply(undefined, _.drop(arguments, 1));
      });
    },

    finishProcess: function(f) {
      var controller = this;
      return _.wrap(f, function(func) {
        var rc = func.apply(undefined, _.drop(arguments, 1));
        controller.view.trigger("end_process.busybox.s2");
        return rc;
      });
    }
  });

  return BaseController;
});
