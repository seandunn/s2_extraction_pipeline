define([
  "text!app-components/labelling/_scanning.html",
  "lib/util"
], function(View, Util) {
  var template = _.compose($, _.template(View));

  return function (context) {
    var html  = template(_.extend({
      label: undefined
    }, context));

    var success = function(padded) {
      html.trigger("s2.barcode.scanned", [padded]);
    };
    var invalid = function(padded) {
      html.trigger("s2.status.error", "Unacceptable barcode '" + padded);
    };

    var barcode    = html.find("input[type=text]");
    var validation = context.validation || prefixValidation(context.acceptable);
    barcode.enterHandler(function() {
      // TODO: Probably should check for a valid barcode
      var padded = _.string.lpad(barcode.val(), context.length || 13, "0");
      barcode.val(padded);
      (validation(padded) ? success : invalid)(padded);
    });
    html.on("s2.status.error",    function() { html.addClass("error"); });
    html.on("s2.barcode.scanned", function() { html.removeClass("error"); });

    _.extend(html, {
      reset: function() {
        barcode.val("").prop("disabled", false);
      }
    });

    return {
      view: html,
      events:{
        "s2.reception.reset_view": _.bind(html.reset, html),
        "s2.activate": $.haltsEvent($.ignoresEvent(_.partial(_.bind(barcode.prop, barcode), "disabled", false))),
        "s2.deactivate": $.haltsEvent($.ignoresEvent(_.partial(_.bind(barcode.prop, barcode), "disabled", true))),
        "focus": $.haltsEvent($.ignoresEvent(_.bind(barcode.focus, barcode)))
      }
    };
  }

  function prefixValidation(acceptable) {
    if (_.isEmpty(acceptable)) {
      return _.constant(true);
    } else {
      return function(padded) {
        return _.some(acceptable, function(a) { return _.str.startsWith(padded, a); });
      };
    }
  }
});
