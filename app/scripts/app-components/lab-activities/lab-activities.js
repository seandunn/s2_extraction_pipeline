define([
  "app-components/process-choice/process-choice",
  "app-components/re-racking/re-racking",
  "app-components/gel-scoring/gel-scoring",
  "app-components/inbox/inbox"
], function(ProcessChoice, Reracking, GelScoring, Inbox) {
  "use strict";

  return function(context) {
    return new ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", id: "re-racking", constructor: Reracking},
        {label: "Gel Scoring", id: "gel-scoring", constructor: GelScoring},
        {label: "Unlysed Sample Inbox", id: "unlysed-inbox", constructor: Inbox}
      ]
    }, context));
  };
});
