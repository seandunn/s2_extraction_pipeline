define([
  "lib/underscore_extensions"
], function() {
  "use strict";

  return {
    // These are the validations that work with the sample details passed.
    nonEmptyString:  validatePresenceOf,

    // Here's a basic validation function, where you pass in a predicate function (which will receive the parameters
    // of the function) and an error handler (called with the object).
    validation: validation,

    // These define whether the validation is optional or mandatory and should be passed as the first argument
    // of the validation.
    optional:   pushError,
    mandatory:  forceError

  };

  function pushError(message, object) {
    object.errors.push(message);
  }

  function forceError(message, object) {
    pushError(message, object);
    object.invalid = true;
  }

  function validation(predicate, error) {
    return function(object) {
      if (!predicate.apply(this, arguments)) {
        error(object);
      }
      return object;
    };
  }

  function validatePresenceOf(error, field) {
    return validation(function(object) {
      return !_.str.isBlank(object.row[field]);
    }, _.partial(error, field + " is not set"));
  }
});
