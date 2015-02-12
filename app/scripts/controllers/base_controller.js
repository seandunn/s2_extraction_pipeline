//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define(["config","event_emitter","lib/barcode_checker","lib/util"], 
  function (appConfig, EventEmitter, BarcodeChecker, Util) {
  "use strict";

  var BaseController = new EventEmitter();

  $.extend(BaseController, {
    getAppConfig: function() { return appConfig; },
    // This should be registered with model not controller
    getS2Root: function(user) { return this.owner.getS2Root(user); },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },
    
    bindReturnKey: function (element, successCallback, errorCallback, validationCallback) {
      
      function delayedEmptyInput(input) {
        setTimeout(function () {
          $(input).val('').attr("disabled", false).focus();
        }, 250);      
      }
      
      var input = $("input", element);
      return element.on("keyup", input, _.bind(function(event) {
        if ((event.which === 13) || (event.which === 9)) {
          var value = input.val();
          if (validationCallback(value)) {
            $(input).val('').attr("disabled", true);
            var processInput = _.bind(function() {
              var promise = successCallback.call(this, value, element, this);
              if (promise && !_.isUndefined(promise.fail)) {
                this._promiseInProgress = promise;                
                promise.then(_.bind(function() {
                  this._promiseInProgress = null;
                }, this), _.bind(function() {
                  this._promiseInProgress = null;
                  delayedEmptyInput(input);
                }, this));
              }
            }, this)
            /*
             * As the workflow of this handler makes uses of promises, it could be possible that
             * two promises executed in parallel validate the same piece of labware twice, inserting
             * it twice in the interface too. To avoid this, we will not execute validation processes in
             * parallel, as the validation is not an idempotent operation.
             */
            if (!!this._promiseInProgress) {
              this._promiseInProgress.done(processInput);
            } else {
              processInput();
            }
          } else {
            errorCallback(value, element, this);
            delayedEmptyInput(input)
          }
        }
      }, this));
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
