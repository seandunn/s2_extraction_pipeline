//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'text!html_partials/_scan_barcode.html'
], function ( scanBarcodePartialHtml ) {
  'use strict';

  var ScanBarcodeController = function ( owner, controllerFactory ) {
    this.owner = owner;
    this.controllerFactory = controllerFactory;

    return this;
  };

  ScanBarcodeController.prototype = {
    init: function (inputModel) {
      this.model = inputModel;
      
      return this;
    },

    template: _.template(scanBarcodePartialHtml),

    renderView: function () {
      this.view = $(this.template({templateData: this.model}));
      this.getElements();

      return this.view;
    },

    getElements: function() {
      this.progressView = $('div.progress', this.view);
      this.barView = $('div.bar', this.view)
    },

    showProgress: function() {
      this.progressView.show();

      return this;
    },

    updateProgress: function(percentage) {
      if ( percentage === 100 ) {
        this.barView.on( 'transitionend', _.bind(function(e) { 
          this.hideProgress(400); 
        }, this));
      }

      this.barView.css( 'width', [percentage, '%'].join("") );

      return this;
    },

    hideProgress: function(delay) {
      if (!_.isNull(delay) && delay > 0) {
        var progressViewHide = _.bind(this.progressView.hide, this.progressView);
        _.delay(progressViewHide, delay);
      } else {
        this.progressView.hide();
      }

      return this;
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
