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
      var parent = this.jquerySelector();

      // We have to append to the document or events won't register
      parent.empty().append(this.template({
        user:         model.user,
        processTitle: model.processTitle
      }));

      var view = this;
      parent.find(".nextBtn").click(function() {
        view.owner.childDone(view, 'next', {});
      });
      parent.find(".printButton").on('click', function (e) {
        that.owner.childDone(that, "savePrintBC", {});
      });
    },

    setPrintButtonEnabled: function(isEnabled) {
      this.jquerySelector().find('.printButton')[isEnabled ? 'removeAttr' : 'attr']('disabled', 'disabled');
    },

    toggleHeaderEnabled: function() {

    },

    clear: function() {
      this.jquerySelector().empty();
    }
  });

  return View;
});
