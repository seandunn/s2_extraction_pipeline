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