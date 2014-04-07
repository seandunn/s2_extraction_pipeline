define([
  "event_emitter",
  "lib/underscore_extensions"
], function(EventEmitter) {

  function Component(context) {
    this.context = context || {};
    this.config = this.context.config || {};
    this.owner = this.context.owner || {};
    this._init();
  }

  Component.prototype._init = function() {
    if (this.viewTemplate) {
      this.template = _.compose($, _.template(this.viewTemplate));
      this.view = this.template(this.config);
    }

    this._createComponents();
    this._attachComponents();
    this._setupListeners();
    this._afterInit();
  }

  Component.prototype._createComponents = function() {
    if (!this.components) return;

    _.each(this.components, function(component, name) {
      var fn = Object.create(component.constructor.prototype);
      this[name] = component.constructor.call(fn, component.args);
    }, this);
  }

  Component.prototype._sendStatus = function(type, msg) {
    this.view.trigger(type + ".status.s2", msg);
  }
  
  // To be overidden if so desired...
  Component.prototype._attachComponents = _.ignore;
  Component.prototype._setupListeners = _.ignore;
  Component.prototype._afterInit = _.ignore;

  _.extend(Component.prototype, EventEmitter.prototype);

  return Component;
});