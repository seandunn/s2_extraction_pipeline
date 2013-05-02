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

      container.on('change','.kitSelect', function(event) {
        var valid = component.owner.model.validateKitTubes(event.currentTarget.value);
        component.message(
          valid ? 'success' : 'error',
          'This kit ' + (valid ? 'is' : 'is not') + ' valid for the selected tubes'
        );

        component.owner.model.kit.valid = valid;
        component.owner.model.fire();
      });
    },
    toggleHeaderEnabled: function(isEnabled) {
      this.selector().find('.kitSelect')[isEnabled ? 'removeAttr' : 'attr']('disabled', 'disabled');
    },
    clear: function() {
      this.selector().empty();
    },

    message: function(type, message) {
      this.selector().find('.validationText').removeClass('alert-error alert-info alert-success').addClass('alert-' + type).text(message);
    },
    getKitTypeSelection: function() {
      return this.selector().find('.kitSelect').val().split('/');
    }
  });

  return View;

});

