define([
  "jquery",  // jquery will be in the global namespace
  "lib/underscore_extensions"
], function() {
  "use strict";

  function isServerOk(xhr) {
    return xhr.status === 200;
  }

  // Extend the behaviour of the jQuery top level object
  _.extend($, {
    // Performing Ajax with binary data through jQuery isn't really possible as the data comes
    // back and gets converted to a string, which is treated as Unicode and becomes invalid in
    // the process.  So here we drop to XMLHttpRequest in such a way that we can deal with the
    // data using Blob.
    binaryAjax: function(options) {
      var deferred = $.Deferred();
      var fail     = function() { deferred.reject("Communications error with backend systems!"); };

      var xhr      = new XMLHttpRequest();
      xhr.open(options.type, options.url, true);
      xhr.responseType = "blob";
      xhr.onerror      = fail;
      xhr.onload       = function() {
        if (isServerOk(xhr)) {
          deferred.resolve(xhr.response);
        } else {
          fail();
        }
      };
      xhr.send(options.data);
      return deferred.promise();
    },

    // Chain deferreds really
    chain: function(handlers, chaining) {
      if (handlers.length === 0) { return; }   // It's fair to assume this is an immediate return of undefined!

      var args = _.drop(arguments, 2);
      return _.chain(handlers).drop(1).reduce(chaining, handlers[0].apply(handlers[0], args)).value();
    },

    // Wait for all of the promises to complete, whether that is resolution or rejection.
    waitForAllPromises: function(promises) {
      return this.chain(_.map(promises, _.partial(_.partial, _.identity)), _.regardless);
    },

    // Wraps the given function in another function that will drop the event argument.  This is useful if
    // you have an event being sent that you do not care about the type, but you do care about the
    // arguments passed as part of the event trigger.
    ignoresEvent: handlesEvents(function(f) {
      return function() {
        return f.apply(this, _.drop(arguments, 1));
      };
    }),
    
    ignoresChildrenEvent: function(possibleParent, f) {
      function isChildren(dom, possibleParent, iteration) {
        iteration = (iteration || 0) + 1;
        return ((dom.parentNode === possibleParent) ||
        (possibleParent === document.body) || ((dom.parentNode !== document.body) &&
        (iteration >= 0) && (iteration < 10) && (isChildren(
          dom.parentNode, possibleParent, iteration))));
      }
      return function(event) {
        var value = (!isChildren(event.target, possibleParent)) ? f.apply(this,
          arguments) : false;
        return value;
      };      
    },

    // Wraps the given handler to prevent the event from propagating up the DOM tree.
    stopsPropagation: handlesEvents(function(f) {
      return function(event) {
        var rc = f.apply(this, arguments);
        if (!rc) event.stopPropagation();
        return rc;
      };
    }),

    // Causes the event to be halted after returning from the specified handler.  Essentially a wrapper around
    // f such that it always returns false.
    haltsEvent: function(f) {
      return function() {
        f.apply(this, arguments);
        return false;
      };
    },

    // Composite event handler, returns true if all event handlers return true.
    compositeHandler: function() {
      if (arguments.length == 1) { return arguments[0]; }   // No need to make composite!
      return _.compose(_.partial(_.flip(_.every), _.isTruthy), _.composite.apply(undefined, arguments));
    }

  });

  // Extend the behaviour of a jQuery selected element.
  _.extend($.fn, {
    // Binds a keypress handler to the given element that will call the specified function when the 
    // enter key is pressed.
    enterHandler: function(f) {
      this.bind("keypress", function(event) {
        if (event.which !== 13) { return; }
        return f.apply(this, arguments);
      });
    },

    // Function that binds a click handling that will ensure that it is blocked until the button has
    // completed.
    lockingClick: function(f) {
      var button = this;
      button.click(_.debounce(function() {
        button.prop("disabled", true);

        var args = Array.prototype.slice.call(arguments);
        args.unshift(button);
        return f.apply(this, args);
      }, 250));
    },

    // Enables simple data binding such that when the value is set then the element is displayed.  A
    // subsequent call to reset will reset the data and hide the element.
    dataHelper: function(attribute) {
      return _.extend({
        element: this,

        reset: function() {
          this.element.removeData(attribute).hide();
          return this;
        }
      }, _.build(attribute, function(d) {
        this.element.data(attribute, d).show();
        return this;
      }));
    },

    // Returns a function that can be used to fire an event whenever another event fires, because we
    // repeatedly do this across our codebase.  The arguments to the event trigger come initially
    // from the call to this function, plus the ones to the event itself, minus the inbound event.
    eventTrigger: function() {
      var target = this;
      var args   = Array.prototype.slice.call(arguments);
      return $.ignoresEvent(function() {
        target.trigger.apply(target, args.concat(arguments));
      });
    }
  });

  return $;

  // Convenience function for helper functions that deal with "$.on" event handlers.  The handlers
  // can either be a function, in which case the helper function is called, or an object, in 
  // which case a new object is built.
  function handlesEvents(f) {
    return function(events) {
      if (_.isFunction(events)) return f(events);

      return _.chain(events)
              .map(function(h,e) { return [e, f(h)]; })
              .object()
              .value();
    }
  }
});
