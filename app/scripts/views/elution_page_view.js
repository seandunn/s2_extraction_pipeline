define(['text!extraction_pipeline/html_partials/elution_loading_partial.html'], function (elutionLoadingPartialHtml) {

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

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

    var template = _.template(elusionLoadingPartialHtml);

    // set the user and indices as template data
    var templateData = {
      user: model.user,
      processTitle: model.processTitle
    };

    var parent = this.jquerySelector();
    parent.empty().append(template(templateData));


    // We have to append to the document or events won't register
    var startButton = parent.find(".startButton");
    var printButton = parent.find(".printButton");
    var that = this;

    startButton.on('click', function(e) {
        that.owner.childDone(that, "next", {});
    });
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
