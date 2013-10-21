define([
  "app-components/process-choice/process-choice",
  "app-components/manifest/maker",
  "app-components/manifest/reader"
], function(ProcessChoice, ManifestMaker, ManifestReader) {
  "use strict";

  return function (context) {
    return ProcessChoice(_.extend({
      components: [
        {label: "Create a manifest", constructor: ManifestMaker  },
        {label: "Read a manifest",   constructor: ManifestReader }
      ]
    }, context));
  };
});
