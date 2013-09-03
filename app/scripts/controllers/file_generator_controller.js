define([
  "controllers/base_controller",
  "views/file_generator_view",
  'lib/pubsub',

  // Add file generator models after this point to have them automatically picked up
  "models/file_generator/nano_drop"
], function(Base, View, PubSub) {
  'use strict';

  var formats =
    _.chain(arguments)
     .drop(3) // Base, View, ...
     .reduce(function(memo, module) {
       module.register(function(name, code) {
         memo[name] = code;
       });
       return memo;
     }, {})
     .value();

  return _.extend(Object.create(Base), {
    register: function(callback) {
      var controllerClass = this;
      callback("file_generator_controller", function() {
        var instance = Object.create(controllerClass);
        controllerClass.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function(owner, factory, config) {
      this.class             = 'FileGeneratorController';
      this.owner             = owner;
      this.config            = config;
      this.controllerFactory = factory;
    },

    setupController: function(inputModel, selector) {
      this.model    = Object.create(formats[this.config.format]).init(this, this.config, inputModel);
      this.selector = selector;
      this.view     = new View(this, this.selector);
      this.view.renderView({
        batch: this.model.batch && this.model.batch.uuid,
        user:  this.model.user
      });
    },

    release: function() {
      this.view.clear();
      return this;
    },

    focus: function() {
    },

    initialController: function() {
    },

    // Called from the onClick handler of the button on the view, but with 'this' set to an instance of this class.
    triggerDownload: function() {
      this.model.generateFile(_.bind(this.view.downloadFile, this.view));
      PubSub.publish("s2.step_controller.next_process", this, {batch: this.model.batch});
    }
  });
});
