define([
  'lib/file_handling/manifests',
  'lib/file_handling/nano_drop',
  'lib/file_handling/racking',
  'lib/file_handling/volume'
], function(Manifests, NanoDrop, Racking, Volume) {
  'use strict';

  return {
    nanoDropCsvToArray: NanoDrop.from,
    volumeCsvToArray: Volume.from,
    manifestCsvToArray: Manifests.from,
    rackingCsvToJson: Racking.from
  };
});
