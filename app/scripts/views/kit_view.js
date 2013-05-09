define([
       'text!extraction_pipeline/html_partials/kit_partial.html'
], function(partial) {
  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var html = this.template({
        user: model.user,
        processTitle: model.processTitle
      });

      var component = this;
      var container = this.selector().empty().append(html);

      container.on('keypress','input', function(event) {
        if (event.which === 13) {
          component.owner.childDone(component.owner, 'barcodeScanned', event.currentTarget.value);
        }
      });
    },
    toggleHeaderEnabled: function(isEnabled) {
      this.selector().find('.kit-select')[isEnabled ? 'removeAttr' : 'attr']('disabled', 'disabled');
    },
    clear: function() {
      this.selector().empty();
    },

    message: function(type, message) {
      this.selector().find('.validationText').removeClass('alert-error alert-info alert-success').addClass('alert-' + type).text(message);
    },
    getKitTypeSelection: function() {
      return this.selector().find('.kit-select').val().split('/');
    }
  });

  return View;

});

