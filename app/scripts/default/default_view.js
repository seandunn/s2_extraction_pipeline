define(['text!extraction_pipeline/html_partials/default_page_partial.html'], function (defaultPagePartialHtml) {
  "use strict";

  var loginview = function (owner, jquerySelection) {
    // constructor
    this.owner = owner;
    this.jquerySelection = jquerySelection;
  };

  loginview.prototype.release = function () {
    return this.jquerySelection().empty();
  };

  loginview.prototype.renderView = function (errorText) {

    // set the data as template data
    var templateData = {
      errorText:errorText
    };

    // makes sure that the container has been emptied first...
    this.release().append(_.template(defaultPagePartialHtml)(templateData));
  };

  return loginview;
});

