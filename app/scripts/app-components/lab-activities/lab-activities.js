define([
  'app-components/process-choice/component',
  'app-components/re-racking/component'
], function(ProcessChoice, Reracking) {
  return function(context) {
    return ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", constructor: Reracking}
      ]
    }, context));
  };
});
