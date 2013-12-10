define([
  "text!app-components/gel-scoring/_score.html",
  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (partialScoring) {
  "use strict";

  var templateScore = _.template(partialScoring);

  return function(context) {
    var view  = $("<div id='scoring-resource'></div>");
    
    return {
      view:   view,
      events: {
        "selected-gel.gel-scoring-selection.s2": $.ignoresEvent(_.partial(renderScoringResource, view))
      }
    };
  };


  function renderScoringResource(view, resource) {
    view.html("");
    var scoringHtml = templateScore({
      barcode: resource.labels.barcode.value,
      xLabels: _.times(resource.number_of_columns, _.identity),
      yLabels: _.times(resource.number_of_rows, function(n) { return String.fromCharCode("A".charCodeAt(0)+n); })
    });
    view.append(scoringHtml);
  }
});
  
