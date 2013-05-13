define(['config'], function (config) {
  'use strict';

  var BasePresenter = Object.create(null);

  $.extend(BasePresenter, {
    getS2Root:function () {
      var deferredS2Root = new $.Deferred();
      if (!this.s2Root) {
        var that = this;
        this.owner.getS2Root().done(function (result) {
          that.s2Root = result;
          deferredS2Root.resolve(result);
        }).fail(function () {
          deferredS2Root.reject();
        });
      } else {
        deferredS2Root.resolve(this.s2Root);
      }
      return deferredS2Root.promise();
    },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    bindReturnKey: function (element, callback, errorCallback) {
      var presenter = this

      return element.on("keypress", "input", function (e) {
        if (e.which !== 13) return;

        if (/^\d{13}$/.exec(e.currentTarget.value) !== null) {
          callback(e, element, presenter);
        } else {
          errorCallback(e, element, presenter);
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
