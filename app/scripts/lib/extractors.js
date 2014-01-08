define(function() {
  "use strict";

  var Extractors = Object.create(null);

  _.extend(Extractors, {
    checkbox: function(element) {
      return element.find("input:checkbox:first").is(":checked");
    },
      
    select: function(element) {
      return element.find("select:first").val();
    },

    span: function(element) {
      return element.find("span:first").text();
    }
  });
  
  return Extractors;
});