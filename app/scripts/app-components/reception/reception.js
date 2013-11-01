define([
  "app-components/process-choice/process-choice",
  "app-components/manifest/maker",
  "app-components/manifest/reader"
], function(ProcessChoice, ManifestMaker, ManifestReader) {
  "use strict";

  return function (context) {
    return new ProcessChoice(_.extend({
      components: [
        { label: "Create a Manifest", id: "maker",  constructor: ManifestMaker  },
        { label: "Read a Manifest",   id: "reader", constructor: ManifestReader }
      ]
    }, context));
  };
});
