define([
  "app-components/process-choice/process-choice",
  "app-components/re-racking/re-racking"
], function(ProcessChoice, Reracking) {
  "use strict";

  return function(context) {
    return ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", constructor: Reracking}
      ]
    }, context));
  };
});
