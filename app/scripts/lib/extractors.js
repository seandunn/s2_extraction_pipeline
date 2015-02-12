//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
