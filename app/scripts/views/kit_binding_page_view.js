define([
  'text!extraction_pipeline/html_partials/kit_binding_partial.html'
], function (kitPartialHtml) {
  'use strict';

  var View = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;
    this.template = _.template(kitPartialHtml);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      this.jquerySelector().append(this.template({}));
    },

    setPrintButtonEnabled: function(isEnabled) {

    },

    toggleHeaderEnabled: function() {

    },

    clear: function() {
      this.jquerySelector().empty();
    }
  });

  return View;
});
