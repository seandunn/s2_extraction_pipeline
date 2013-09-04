define([
  'models/base_page_model',
  'lib/file_handling/nano_drop'
], function(Base, FileHandler) {
  'use strict';

  return _.extend(Object.create(Base), {
    register: function(callback) {
      callback("NanoDrop", this);
    },

    init: function(owner, config, setup) {
      this.owner  = owner;
      this.config = config;
      this.plate  = setup.initialLabware;

      this.initialiseCaching();
      return this;
    },

    setupModel: function(setupData) {
      this.cache.push(setupData.batch);
      this.batch = setupData.batch;
      return this;
    },

    generateFile: function(callback) {
      callback(FileHandler.to(this.plate), {
        mime: "text/csv",
        filename: "" + this.plate.labels.barcode.value + ".txt"
      });
    }
  });
});
