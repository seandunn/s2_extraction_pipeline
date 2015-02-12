//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'underscore_string',

  // Our extensions that we need to load
  'lib/underscore_extensions/functional',
  'lib/underscore_extensions/tabular',
  'lib/underscore_extensions/utility',
  'lib/underscore_extensions/csv',
  'lib/underscore_extensions/promises'
], function() {
  return _.chain(arguments).drop(1).reduce(function(underscore, extension) {
    underscore.mixin(extension);
    return underscore;
  }, _);
});
