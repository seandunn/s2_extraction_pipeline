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
