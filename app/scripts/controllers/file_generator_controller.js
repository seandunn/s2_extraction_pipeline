//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
      PubSub.publish("next_process.step_controller.s2", this, {batch: this.model.batch});
    }
  });
});
