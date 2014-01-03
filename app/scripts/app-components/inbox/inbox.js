define([
  "text!app-components/inbox/_component.html",
  "default/default_model",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (htmlPartial, DefaultPageModel) {
  "use strict";

  var template = _.compose($, _.template(htmlPartial));

  var initializeViz;

  function createHtml(context) {
    var html = template(context);

    initializeViz = function initializeViz() {
      var model = Object.create(DefaultPageModel).init(context.app);

      var placeholderDiv = html.find(".tableau-viz")[0];
      var url = "https://globalreporting.internal.sanger.ac.uk/t/dna/views/S2Test/Dashboard1";

      var options = {
          width: placeholderDiv.offsetWidth,
          height: placeholderDiv.offsetHeight,
          hideTabs: true,
          hideToolbar: true,
          onFirstInteractive: function () {
            // workbook = viz.getWorkbook();
            // activeSheet = workbook.getActiveSheet();
          }
        };

      var viz = new tableauSoftware.Viz(placeholderDiv, url, options);

      viz.addEventListener(tableauSoftware.TableauEventName.MARKS_SELECTION, onMarksSelection);

      function onMarksSelection(marksEvent) {
        return marksEvent.getMarksAsync().then(reportSelectedMarks);
      }

      // When a Tableau mark has been clicked we run the following...
      function reportSelectedMarks(marks) {
        context.user.then(function(user){
          model.user = user;
          var ean13 = marks[0].$0.$1.$1._ean13_barcode.value;

          model
          .setLabwareFromBarcode(ean13)
          .then(function(model){
            // owner in this case is app.js
            model.owner.childDone(undefined, "done", model);
          });
        });
      }
    };

    return html;
  }

  return function(context) {
    var view = createHtml(context),
    events = {
      "shown": function(){ initializeViz(); }
    };

    return {
      view:   view,
      events: events
    };
  };
});
