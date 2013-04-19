define([
  'text!extraction_pipeline/html_partials/step_partial.html'
], function(partial) {
  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var parent = this.selector().empty().append(this.template({
        user:         model.user,
        processTitle: model.processTitle
      }));

      var view = this;

      _.each(['start','end','next','print'], function(event) {
        parent.find('.'+event+'Button').on('click', function() {
          view.owner.childDone(view, event, {});
        });
      });
    },

    setPrintButtonEnabled: function(isEnabled) {
      this.selector().find('.printButton')[isEnabled ? 'removeAttr' : 'attr']('disabled', 'disabled');
    },

    toggleHeaderEnabled: function() {

    },

    clear: function() {
      this.selector().empty();
    }
  });

  return View;
});
