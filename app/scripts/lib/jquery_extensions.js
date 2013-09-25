define([], function() {
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
    }
  });

  // Extend the behaviour of a jQuery selected element.
  _.extend(jQuery.fn, {
    // Binds a keypress handler to the given element that will call the specified function when the 
    // enter key is pressed.
    enterHandler: function(f) {
      this.bind("keypress", function(event) {
        if (event.which !== 13) return;
        f();
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
    }
  });

  return $;

  function isServerOk(xhr) {
    return xhr.status === 200;
  }
});
