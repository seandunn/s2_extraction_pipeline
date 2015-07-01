//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  "labware/standard_mappers"
], function(StandardMapper) {
  'use strict';

  // This is a mixin for classes that wish to do labware presentation.
  return {
    presentResource: function(resource) {
      return _.isUndefined(resource) ? undefined : StandardMapper(resource);
    }
  };
});
