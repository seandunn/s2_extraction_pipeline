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
      _.templateSettings.variable = 'rc';

      var parent = this.selector().empty().append(this.template({
        user:         model.user,
        processTitle: model.processTitle,
        buttons: model.buttons
      }));

      var view = this;

//      _.each(['start','end','next','print'], function(action) {
//        parent.find('.'+action+'Button').on('click', function() {
//          view.owner.childDone(view, action, {});
//        });
//      });
      _.each(model.buttons, function(buttonDetails) {
        parent.find('.'+buttonDetails.action+'Button').on('click', function() {
          view.owner.childDone(view, buttonDetails.action, {});
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
    enableButton:function(action){
      this.setButtonEnabled(action, true);
    },
    disableButton:function(action){
      this.setButtonEnabled(action, false);
    },
    setButtonEnabled: function(action,isEnabled) {
      getButtonSelectionByAction(this.selector(),action)[isEnabled ? 'removeAttr' : 'attr']('disabled', 'disabled');
    },
    setPrintButtonEnabled: function(isEnabled) {
      this.setButtonEnabled('Print',isEnabled);
    },

    toggleHeaderEnabled: function() {

    },

    clear: function() {
      this.selector().empty();
    }
  });

  function getButtonSelectionByAction(selector,action){
    return selector.find('.'+action+'Button').show();
  }

  return View;
});
