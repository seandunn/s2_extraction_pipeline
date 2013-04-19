define(['text!extraction_pipeline/html_partials/byproduct_transfer_partial.html'], function (byproductTransferPartialHtml) {

  'use strict';

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var transferView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  transferView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }

    var template = _.template(byproductTransferPartialHtml);

    // set the user and indices as template data
    var templateData = {
      user: model.user,
      processTitle: model.processTitle
    };

    var parent = this.jquerySelector();
    parent.empty().append(template(templateData));

    // We have to append to the document or events won't register
    var nextButton = parent.find(".nextButton");
    var printButton = parent.find('.printButton');
    var that = this;

    nextButton.on('click', function(e) {
        that.owner.childDone(that, "next", {});
    });

    printButton.on('click', function(e) {
      that.owner.childDone(that, "savePrintBC", {});
    });
  };

  transferView.prototype.toggleHeaderEnabled = function () {
  };

  transferView.prototype.setPrintButtonEnabled = function (isEnabled) {
    var printButton = this.jquerySelector().find('.printButton');

    if (isEnabled) {
      printButton.removeAttr('disabled');
    } else {
      printButton.attr('disabled', 'disabled');
    }
  };

  transferView.prototype.setNextButtonEnabled = function (isEnabled) {
    var nextButton = this.jquerySelector().find('.nextButton');

    if (isEnabled) {
      nextButton.removeAttr('disabled');
    } else {
      nextButton.attr('disabled', 'disabled');
    }
  };


  transferView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return transferView;

});
