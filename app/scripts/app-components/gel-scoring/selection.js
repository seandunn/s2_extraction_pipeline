define([
  "text!app-components/gel-scoring/_selection.html",
  "text!app-components/gel-scoring/_tableSelection.html",
  "app-components/labelling/scanning",
  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (partialSelection, partialTable, BarcodeScanner) {
  "use strict";

  var template = _.template(partialSelection), 
      templateTableSelection = _.template(partialTable);

  return function(context) {
    var view  = createHtml(context);

    return {
      view:   view,
      events: {
      }
    };
  };

  function createHtml(context) {    
    var html = $(template());
    
    // Build a barcode scanner component and hook it up.
    var barcodeScanner = BarcodeScanner({
      label: "Scan gel barcode",
    });
    html.find("#barcodeReader").append(barcodeScanner.view);
    html.on(barcodeScanner.events);
    context.getS2Root().then(function(root) {
      root.findByRole("samples.rack.stock.rna").then(function() {
        var resources = arguments;
        var partial = templateTableSelection({
          resourcesList: _.map(resources, function(resource) {      
            return {
              barcode: resource.labels.barcode.value,
              isScored: false
            };
          })});
        $("table", html).append(partial);
        _.each(_.zip($("table button", html), resources), function(pair) {
           var node = pair[0], resource = pair[1];
           $(node).click(_.partial(function(resource) {
             html.trigger("selected-gel.gel-scoring-selection.s2", resource);
           }, resource));
        });
      });
    });
    return html;
  }
});

