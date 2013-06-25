define(['config'
, 'extraction_pipeline/lib/barcode_checker'
, 'extraction_pipeline/lib/util'
], function (appConfig, BarcodeChecker, Util) {
  'use strict';

  var BasePresenter = Object.create(null);

  $.extend(BasePresenter, {
    // This should be registered with model not presenter
    getS2Root: function(user) { return this.owner.getS2Root(user); },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    bindReturnKey: function (element, successCallback, errorCallback, validationCallback) {
      var thisPresenter = this;

      var validation = validationCallback || function (element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) return;

          if (_.some(BarcodeChecker, function (validationCallback) {
            return validationCallback(Util.pad(event.currentTarget.value));
          })) {
            callback(event, element, thisPresenter);
          } else {
            errorCallback(event, element, thisPresenter);
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

  return BasePresenter;
});
