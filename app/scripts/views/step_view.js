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
      var parent = this.selector().empty().off().append(this.template(model));

      var view = this;

      _.each(model.buttons, function(buttonDetails) {
        parent.find('.'+buttonDetails.action+'Button').on('click', function() {
          view.owner.childDone(view, buttonDetails.action, view.selector().find('.printer-select').val());
        });
      });
    },
    showButton:function(action){
      this.setButtonVisible(action, true);
    },
    hideButton:function(action){
      this.setButtonVisible(action, false);
    },
    setButtonVisible:function(action, visible){
      if (visible)
        getButtonSelectionByAction(this.selector(),action).show();
      else
        getButtonSelectionByAction(this.selector(),action).hide();
    },

    setButtonEnabled: function(action,isEnabled) {
      if (isEnabled) {
        getButtonSelectionByAction(this.selector(), action).
          removeAttr('disabled').
          focus();
      } else {
        getButtonSelectionByAction(this.selector(), action).
          attr('disabled', 'disabled');
      }
    },

    setPrintButtonEnabled: function(isEnabled) {
      this.setButtonEnabled('Print',isEnabled);
      this.selector().find('.printer-select').removeAttr('disabled');
    },

    toggleHeaderEnabled: function() { },

  });

  function getButtonSelectionByAction(selector,action){
    return selector.find('.'+action+'Button').show();
  }

  return View;
});
