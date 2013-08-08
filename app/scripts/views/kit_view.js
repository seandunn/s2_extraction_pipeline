define([
       'text!html_partials/kit_partial.html'
], function(partial) {
  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var html = this.template(model);
      var component = this;

      this.selector().
        html(html).
        on('keypress','input', function(event) {
        if (event.which === 13) {
          component.owner.childDone(component.owner, 'barcodeScanned', event.currentTarget.value);
        }
      });
    },

    message: function(type, message) {
      this.selector().find('.validationText').
        removeClass('alert-error alert-info alert-success').
        addClass('alert-' + type).
        text(message);
    },

  });

  return View;

});

