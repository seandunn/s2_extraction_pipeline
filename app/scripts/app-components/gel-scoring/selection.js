define([
  "text!app-components/gel-scoring/_selection.html",
  "text!app-components/gel-scoring/_tableSelection.html",
  "app-components/labelling/scanning",
  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (partialSelection, partialTable, BarcodeScanner) {
  "use strict";
  var ROLE_SCORED = "samples.qc_gel.imager.rna.done.scored", 
      ROLE_UNSCORED = "samples.qc_gel.imager.rna.done";
  var template = _.template(partialSelection), 
      templateTableSelection = _.template(partialTable);

  return function(context) {
    var view  = createHtml(context);

    return {
      view:   view,
      events: {  "change-scored.selection.s2": $.ignoresEvent(_.partial(renderTable, context, view)) }
    };
  };
  
  function renderTable(context, html, searchRole) {
    if (!searchRole) {
      searchRole = ROLE_UNSCORED;
      $("input[value=unscored]").prop("checked", "true");
    }
    $(".tableSelection", html).trigger("start_process.busybox.s2");
    context.getS2Root().then(_.partial(function(searchRole, root) {
      root.findByRole(searchRole).then(function() {
        $(".tableSelection", html).trigger("end_process.busybox.s2");
        var resources = arguments;
        if (resources.length===0) {
          $(".tableSelection", html).html("There are no results of this type.");
          return;
        }
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
    }, searchRole));    
    
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
    html.on("scanned.barcode.s2", function(event, barcode) {
      $.stopsPropagation(event);
      context.getS2Root().then(function(root) {
        root.findByLabEan13(barcode).then(function(resource){
          barcodeScanner.view.trigger("reset_view.reception.s2");
          html.trigger("selected-gel.gel-scoring-selection.s2", resource);          
        });
      });
      return false;
    });
    html.on(barcodeScanner.events);    
    renderTable(context, html);
    return html;
  }
});

