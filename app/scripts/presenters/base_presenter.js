define(['config'], function (config) {
  'use strict';

  var BasePresenter = Object.create(null);

  $.extend(BasePresenter, {
    getS2Root:function () {
      if (this.s2Root) return this.s2Root;

      var that = this;
      return this.owner.getS2Root().done(function (result) {
        return that.s2Root = result;
      });
    },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    bindReturnKey: function (element, callback, errorCallback) {
      var presenter = this

      return element.on("keypress", "input", function(event) {
        if (event.which !== 13) return;

        if (/^\d{13}$/.exec(event.currentTarget.value) !== null) {
          callback(event, element, presenter);
        } else {
          errorCallback(event, element, presenter);
        }
      });
    },

    printerList:function() {

      var printerNames = [];
      _.each(config.printers, function(printer) {
        printer.friendlyName = printer.name + ' ' + config.printerTypes[printer.type];
      });

      return config.printers;
    }
  }
          );

          return BasePresenter;
});
