//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([], function() {
  "use strict";
  
  return function(obj1, method1, obj2, method2) {
    var connectedMethod = obj1[method1]; 
    obj1[method1] = function() {
      connectedMethod.apply(obj1, arguments);
      return obj2[method2].apply(obj2, arguments);
    };
  };
});
