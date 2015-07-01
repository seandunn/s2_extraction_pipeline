//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  "use strict";

  var Errors = function() {};

  _.extend(Errors.prototype, {
    errors: [],

    addError: function(msg) {
      this.errors.push(msg);
    },

    getErrors: function() {
      return this.errors;
    },

    emptyErrors: function() {
      this.errors = [];
    },

    hasNoErrors: function() {
      return _.isEmpty(this.errors);
    }
  });

  return Errors;
});
