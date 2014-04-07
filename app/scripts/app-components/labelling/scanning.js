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
    context = context || {};
    var html  = template(_.extend({
      label: undefined,
      icon: undefined
    }, context));

    var barcode    = html.find("input[type=text]");
    var validation = context.validation || lengthValidation(context.acceptable);
    
    var paddedBarcode;
    var success = function(padded) {
      paddedBarcode=padded;
      html.trigger("scanned.barcode.s2", [padded]);
    };
    var invalid = function(padded) {
      html.trigger("error.status.s2", "Unacceptable barcode '" + padded);
    };

    barcode.enterHandler(_.partial(function(barcode) {
      // Do not perform actions if this node is out of dom
      if ($.contains(document, barcode[0])) {
        var padded = _.string.lpad(barcode.val(), context.length || 13, "0");
        barcode.val(padded);
        (validation(padded) ? success : invalid)(padded);
      }
    }, barcode));

    html.on("error.status.s2",    function() { html.addClass("error");    });
    html.on("scanned.barcode.s2", function() { html.removeClass("error"); });

    _.extend(html, {
      reset: function() {
        barcode.val("").prop("disabled", false);
      }
    });

    var obj = {
      name: "scanning.labelling.s2",
      view: html,
      events:{
        "reset.s2": _.bind(html.reset, html),
        "reset_view.reception.s2": _.bind(html.reset, html),
        "activate.s2": $.haltsEvent($.ignoresEvent(_.bind(barcode.prop, barcode, "disabled", false))),
        "deactivate.s2": _.wrap(function(func) {
          return func();
        }, $.haltsEvent($.ignoresEvent(_.bind(barcode.prop, barcode, "disabled", true)))),
        "focus": $.haltsEvent($.ignoresEvent(_.bind(barcode.focus, barcode)))
      },
      setBarcode: function(brc) {
        barcode.val(brc);
      },
      getBarcode: function() {
        return this.barcode;
      },
      enable: function() {
        barcode.attr("disabled", false);
      },
      disable: function() {
        barcode.attr("disabled", true);
      },
      reset: function() {
        barcode.val("").prop("disabled", false);
      }
    };
    
    html.on("scanned.barcode.s2", _.partial(function(obj, event, barcode) {
      obj.barcode = barcode;
    }, obj));
    
    return obj;
  };

});
