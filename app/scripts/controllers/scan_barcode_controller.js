define([
       'text!html_partials/_scan_barcode.html'
], function (scanBarcodePartialHtml) {
  'use strict';

  var ScanBarcodeController = function (owner, controllerFactory) {
    this.owner = owner;
    this.controllerFactory = controllerFactory;
    return this;
  };

  ScanBarcodeController.prototype = {
    init: function (inputModel) {
      this.model = inputModel;
      return this;
    },

    renderView: function () {
      this.view = $(_.template(scanBarcodePartialHtml)(this.model));
      return this.view;
    },

    showProgress: function() {
      $('div.progress', this.view).show();
    },

    updateProgress: function(percentage) {
      var $this = this;

      if (percentage == 100) {
        $('div.bar', this.view).on('transitionend', function() {
          $this.hideProgress();
        })
      }

      $('div.bar', this.view).css('width', [percentage, '%'].join(""))
    },

    hideProgress: function() {
      $('div.progress', this.view).hide();
    }
  }

  return {
    register:function (callback) {
      callback('scan_barcode_controller', function (owner, factory) {
        return new ScanBarcodeController(owner, factory);
      });
    }
  };
});

