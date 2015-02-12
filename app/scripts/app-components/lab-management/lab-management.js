//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
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
            "samples.shipping.blood_!na.shipped"
          ]
        }

      ]
    }, context));
  };
});
