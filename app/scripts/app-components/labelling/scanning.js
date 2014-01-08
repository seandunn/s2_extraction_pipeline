define([
  "text!app-components/labelling/_scanning.html"
], function(View) {
  "use strict";
  var template = _.compose($, _.template(View));

  function lengthValidation(acceptable) {
    if (_.isEmpty(acceptable)) {
      return _.constant(true);
    } else {
      return function(acceptable) {
        return _.some(acceptable, function(str) { return str.length >= 12 && str.length <= 13; });
      };
    }
  }
  
  return function (context) {
    var html  = template(_.extend({
      label: undefined
    }, context));

    var success = function(padded) {
      html.trigger("scanned.barcode.s2", [padded]);
    };
    var invalid = function(padded) {
      html.trigger("error.status.s2", "Unacceptable barcode '" + padded);
    };

    var barcode    = html.find("input[type=text]");
    var validation = context.validation || lengthValidation(context.acceptable);

    barcode.enterHandler(function() {
      var padded = _.string.lpad(barcode.val(), context.length || 13, "0");
      barcode.val(padded);
      (validation(padded) ? success : invalid)(padded);
    });

    html.on("error.status.s2",    function() { html.addClass("error");    });
    html.on("scanned.barcode.s2", function() { html.removeClass("error"); });

    _.extend(html, {
      reset: function() {
        barcode.val("").prop("disabled", false);
      }
    });

    return {
      name: "scanning.labelling.s2",
      view: html,
      events:{
        "reset.s2": _.bind(html.reset, html),
        "reset_view.reception.s2": _.bind(html.reset, html),
        "activate.s2": $.haltsEvent($.ignoresEvent(_.partial(_.bind(barcode.prop, barcode), "disabled", false))),
        "deactivate.s2": _.wrap(function(func) {
          return func();
        }, $.haltsEvent($.ignoresEvent(_.partial(_.bind(barcode.prop, barcode), "disabled", true)))),
        "focus": $.haltsEvent($.ignoresEvent(_.bind(barcode.focus, barcode)))
      }
    };
  };

});
