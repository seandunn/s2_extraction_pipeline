//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
