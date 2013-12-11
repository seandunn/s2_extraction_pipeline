define([
  "text!app-components/gel-scoring/_selection.html",
  "text!app-components/gel-scoring/_tableSelection.html",
  "app-components/labelling/scanning",
  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (partialSelection, partialTable, BarcodeScanner) {
  "use strict";
 var ROLE_SCORED = "samples.qc.gel.imager.done.scored", 
   ROLE_UNSCORED = "samples.qc.gel.imager.done";
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
  
  function renderTable(context, html, searchRole) {
    if (!searchRole) {
      searchRole = ROLE_UNSCORED;
    }
    $(".tableSelection", html).html("Loading...");
    context.getS2Root().then(function(root) {
      root.findByRole(searchRole).then(function() {
        var resources = arguments;
        var partial = templateTableSelection({
          resourcesList: _.map(resources, function(resource) {      
            return {
              barcode: resource.labels.barcode.value,
              isScored: searchRole===ROLE_SCORED
            };
          })});
        
        $(".tableSelection", html).html(partial);
        _.each(_.zip($("table button", html), resources), function(pair) {
           var node = pair[0], resource = pair[1];
           $(node).click(_.partial(function(resource) {
             html.trigger("selected-gel.gel-scoring-selection.s2", resource);
           }, resource));
        });
      });
    });    
    
  }

  function createHtml(context) {      
    var html = $(template());
    
    // Build a barcode scanner component and hook it up.
    var barcodeScanner = BarcodeScanner({
      label: "Scan gel barcode"
    });
    html.find("#barcodeReader").append(barcodeScanner.view);
    _.each(html.find("input[name=scoredChange]"), function(input) {
      var role = $(input).prop("value") === "scored"? ROLE_SCORED : ROLE_UNSCORED;
      $(input).click(_.partial(function(createHtml, context, role) {
        renderTable(context, html, role);
      }, createHtml, context, role));
    });
    html.on(barcodeScanner.events);    
    renderTable(context, html)
    return html;
  }
});

