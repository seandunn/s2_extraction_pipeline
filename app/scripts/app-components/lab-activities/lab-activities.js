define([
  "app-components/process-choice/process-choice",
  "app-components/re-racking/re-racking",
  "app-components/gel-scoring/gel-scoring",
  "app-components/pipeline-graph/pipeline-graph"
], function(ProcessChoice, Reracking, GelScoring, PipelineGraph) {
  "use strict";

  return function(context) {
    return new ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", id: "re-racking", constructor: Reracking},
        {label: "Gel Scoring", id: "gel-scoring", constructor: GelScoring},
        {label: "Pipeline Graph", id: "pipeline-graph", constructor: PipelineGraph}

      ]
    }, context));
  };
});
