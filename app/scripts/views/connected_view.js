define([
  'text!extraction_pipeline/html_partials/connected_partial.html'
], function(template) {
  'use strict';

  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(template);
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      this.selector().html(this.template());
    },

  });

  return View;
});
