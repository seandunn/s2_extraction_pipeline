define([
    "text!app-components/gel-scoring/_component.html",
    "app-components/gel-scoring/selection", "app-components/gel-scoring/score",
  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (partialComponent, GelScoreSelection, GelScoring) {
  "use strict";

  var template = _.compose($, _.template(partialComponent));

  return function(context) {
    var view = template();
    
    var selection = new GelScoreSelection(context);
    view.append(selection.view);

    
    var scoring = new GelScoring(context);
    view.append(scoring.view);
    
    view.on(scoring.events);
    
    // I need to update the selection table whenever a scoring is performed in any gel, but I
    // fire this update event from a float element that in the future will be relocated 
    // into the top level of DOM tree. 
    $(document.body).on(selection.events);    
    
    return {
      view:   view,
      events: {
      }
    };
  };
});
  
