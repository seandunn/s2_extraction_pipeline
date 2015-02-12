//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
