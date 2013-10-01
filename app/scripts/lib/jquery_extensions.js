define([
  "jquery"
], function() {
  // Extend the behaviour of the jQuery top level object
  _.extend(jQuery, {
    // Performing Ajax with binary data through jQuery isn't really possible as the data comes
    // back and gets converted to a string, which is treated as Unicode and becomes invalid in
    // the process.  So here we drop to XMLHttpRequest in such a way that we can deal with the
    // data using Blob.
    binaryAjax: function(options) {
      var deferred = $.Deferred();
      var fail     = function() { deferred.reject("Communications error with backend systems!"); };

      var xhr      = new XMLHttpRequest;
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
      if (handlers.length == 0) return;   // It's fair to assume this is an immediate return of undefined!

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
    ignoresEvent: function(f) {
      return function(event) {
        return f.apply(this, _.drop(arguments, 1));
      };
    }
  });

  // Extend the behaviour of a jQuery selected element.
  _.extend(jQuery.fn, {
    // Binds a keypress handler to the given element that will call the specified function when the 
    // enter key is pressed.
    enterHandler: function(f) {
      this.bind("keypress", function(event) {
        if (event.which !== 13) return;
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

    // Causes the specified element to be swiped into view, and any currently swiped in element
    // to be swiped out.  Note that this works with a CSS class called "swipe-in" and any effects
    // should be added to that class itself.
    swipeIn: function(incoming) {
      var outgoing = this.find(".swipe-in");

      // When the element goes out of scope, hide it.
      outgoing.on("transitionend", _.once(_.bind(outgoing.hide, outgoing)))
              .removeClass("swipe-in")

      // Unfortunately there is an issue that the element, if it's just been shown, will not
      // transition properly.  Hence, we have to put in a short delay, which can give the 
      // impression of a pause which we'd like to get rid of.
      incoming.show();
      window.setTimeout(
        _.bind(_.partial(incoming.addClass, "swipe-in"), incoming),
        10
      );
      return this;
    },

    // Makes the element believe it has been swiped into view!
    swipedIn: function() {
      this.addClass("swipe-in");
      return this;
    }
  });

  return $;

  function isServerOk(xhr) {
    return xhr.status === 200;
  }
});
