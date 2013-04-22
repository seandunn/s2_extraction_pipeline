define(['text!extraction_pipeline/html_partials/elution_loading_partial.html'], function (elutionLoadingPartialHtml) {

  'use strict';

  var elutionView = function (owner, jquerySelector) {
    console.log("hello");
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  elutionView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }

    var template = _.template(elutionLoadingPartialHtml);

    // set the user and indices as template data
    var templateData = {
      user: model.user,
      processTitle: model.processTitle
    };

    var parent = this.jquerySelector();
    parent.empty().append(template(templateData));

    var that = this;

    _.each(['start','end','next'], function(event) {
      parent.find('.'+event+'Button').on('click', function() {
        that.owner.childDone(that, event, {});
      });
    });

    var printButton = parent.find(".printButton");
    printButton.on('click', function(e) {
      that.owner.childDone(that, "savePrintBC", {});
    });
  };

  elutionView.prototype.toggleHeaderEnabled = function() {

  };

  elutionView.prototype.setPrintButtonEnabled = function (isEnabled) {
    var printButton = this.jquerySelector().find('.printButton');

    if (isEnabled) {
      printButton.removeAttr('disabled');
    } else {
      printButton.attr('disabled', 'disabled');
    }
  };

  elutionView.prototype.clear = function () {
    /* clear the view from the current page
    */
    var children = this.jquerySelector().empty();
  };

  return elutionView;

});
