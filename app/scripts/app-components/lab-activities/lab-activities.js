define([
  "app-components/process-choice/process-choice",
  "app-components/re-racking/re-racking",
  "app-components/lysing/lysing"
], function(ProcessChoice, Reracking, Lysing) {
  "use strict";

  return function(context) {
    return new ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", id: "re-racking", constructor: Reracking},
        {label: "Lysing",     id: "lysing",     constructor: Lysing}
      ]
    }, context));
  };
});
