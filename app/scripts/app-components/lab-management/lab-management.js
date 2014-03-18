define([
  "app-components/process-choice/process-choice",
  "app-components/manifest/maker",
  "app-components/manifest/reader",
  "app-components/inbox/inbox"
], function(ProcessChoice, ManifestMaker, ManifestReader, Inbox) {
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
            "samples.shipping.blood_!na.awaiting_shipping",
            "samples.shipping.blood_!na.awaiting_shipping.batched",
            "samples.extraction.lysing.prelysing.blood",
            "samples.extraction.lysing.prelysing.blood.batched",
            "samples.extraction.lysing.blood"
          ]
        }

      ]
    }, context));
  };
});
