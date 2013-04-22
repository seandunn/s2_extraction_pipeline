define([
  'text!extraction_pipeline/html_partials/kit_binding_partial.html'
], function (kitPartialHtml) {

  'use strict';

  var that = this;

  function onNext_clicked(owner, view) {
    /*
     * response to the click on the login button...
     * tells the owner that we want to try a login
     */
    return function () {
      if (owner) {
        owner.childDone(view, "next", { });
      }
    }
  }

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var kitView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  kitView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }


    // set the user and indices as template data
    var templateData = {
      user: model.user,
      processTitle: model.processTitle
    };


    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    var template = _.template(kitPartialHtml);
    parent.empty().append(template(templateData));

    var savePrintBtn = parent.find(".kitSavePrintButton");
    var that = this;

    savePrintBtn.on('click', function (e) {
      that.owner.childDone(that, "savePrintBC", {});
    });

    $('li').addClass("kit");
    $('ul p').addClass("kit");
    $('ul h3').addClass("kit");

    var input = parent.find("input");
    var selector = parent.find(".kitSelect");
    input.on("keypress", function (e) {
      var key = getKey(e);
      if (key === 13) {
        that.owner.childDone(this.owner, "barcodeScanned", this.value);
      }
    });
    selector.on("change", function (e) {
      that.owner.setValidState();
    });

    this.jquerySelector().find(".nextBtn").click(onNext_clicked(this.owner, this));
    this.jquerySelector().find(".kitSelect").prop('selectedIndex', -1);
  };

  kitView.prototype.setPrintButtonEnabled = function (isEnabled) {
    var printButton = this.jquerySelector().find('.kitSavePrintButton');

    if (isEnabled) {
      printButton.removeAttr('disabled');
    } else {
      printButton.attr('disabled', 'disabled');
    }
  };

  kitView.prototype.toggleHeaderEnabled = function (isEnabled) {
    var selection = this.jquerySelector();
    var kitSavePrintButton = selection.find('.kitSavePrintButton');

    if (isEnabled) {
      kitSavePrintButton.removeAttr('disabled');
    } else {
      kitSavePrintButton.attr('disabled', 'disabled');
    }
  };

  kitView.prototype.clear = function () {
    /* clear the view from the current page
     */
    this.jquerySelector().empty();
  };

  return kitView;

});
