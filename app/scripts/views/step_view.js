define([
  'text!html_partials/_step.html', "event_emitter"
], function(partial, EventEmitter) {
  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, EventEmitter.prototype, {
    renderView: function(model) {
      var parent = this.selector().empty().off().append(this.template(model));

      var view = this;

      _.each(model.buttons, function(buttonDetails) {
        parent.find('.'+buttonDetails.action+'Button').on('click', _.bind(function(event) {
          event.preventDefault();
          this.emit("clickButton", buttonDetails.action);
        }, this));
      }, this);
    },
    
    getPrinterSelected: function() {
      return this.selector().find('.printer-select').val();
    },

    showButton:function(action){
      this.setButtonVisible(action, true);
    },

    hideButton:function(action){
      this.setButtonVisible(action, false);
    },
    toggleWaitingPage: function(enable) {
      if (enable) {
        this.selector().find('.component').trigger("start_process.busybox.s2");
      } else {
        this.selector().find('.component').trigger("end_process.busybox.s2");
      }
    },
    release: function() {
      this.selector().empty().off();
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
      this.setButtonEnabled('print',isEnabled);
      if(isEnabled) {
        this.selector().find('.printer-select').removeAttr('disabled');
      }
      else {
        this.selector().find('.printer-select').attr('disabled', 'disabled');
      }
    }
  });

  function getButtonSelectionByAction(selector,action){
    return selector.find('.'+action+'Button').show();
  }

  return View;
});
