define([
  "app-components/process-choice/process-choice",
  "app-components/manifest/maker",
  "app-components/manifest/reader",
  "app-components/inbox/inbox",
  "app-components/pipeline-graph/pipeline-graph"

], function(ProcessChoice, ManifestMaker, ManifestReader, Inbox, PipelineGraph) {
  "use strict";

  return function (context) {
    return new ProcessChoice(_.extend({
      accessList: "Management",
      components: [
        { label: "Create a Manifest", id: "maker",  constructor: ManifestMaker  },
        { label: "Read a Manifest",   id: "reader", constructor: ManifestReader },
        {
          label:         "Unlysed Sample Inbox",
          id:            "unlysed-inbox",
          constructor:   Inbox,
          inboxUrl:      context.app.config.inboxUrl,
          filterByRoles: [
            "samples.extraction.lysing.blood.awaiting_reception",
            "samples.extraction.lysing.blood",
            "samples.extraction.lysing.blood.awaiting_reception",
            "samples.shipping.blood_!na.awaiting_shipping",
            "samples.shipping.blood_!na.awaiting_shipping.batched"
          ]
        },
        {label: "Pipeline Graph", id: "pipeline-graph", constructor: PipelineGraph}


      ]
    }, context));
  };
});
