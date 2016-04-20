//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'lib/reception_templates/generators/tube',
  'lib/reception_templates/generators/plate',
  'lib/reception_templates/generators/filter_paper',
  'lib/reception_templates/generators/vial'
], function() {
  return _.reduce(arguments, function(m,v) { return _.extend(m,v); }, {});
});
