define([
  "text!app-components/gel-scoring/_score.html",
  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (partialScoring) {
  "use strict";

  var templateScore = _.template(partialScoring);
  var getRoot;
  
  return function(context) {
    var view  = $("<div id='scoring-resource'></div>");
    getRoot = context.getS2Root;
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
    
    $("[data-action-s2=download]").click(_.partial(download, view, resource));
    $("[data-action-s2=save]").click(_.partial(save, view, resource));
  }
  
  function download(view, resource) {
    getRoot().then(function(root) {
      root.findGelImageByGel(resource.uuid).then(function(gelImage){
        console.dir(gelImage);
      });
    });
  }
  
  function save(view, resource) {
    var data = {
      uuid: resource.uuid,
      scores: _.chain($("td[data-position-s2]", view)).map(function(td) {
        var pos = $(td).attr("data-position-s2");
        var value = $("select", td).val();
        return [pos, value];
      }).object().value()
    };
    getRoot().then(function(root) {
      root.qualityActions.create.call(_.extend({
        resourceType: "update_gel_image_score", 
        root: root
      }, root.qualityActions.update_gel_image_scores), data);
    });
  }
});