//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "app-components/process-choice/process-choice",
  "app-components/re-racking/re-racking",
  "app-components/gel-scoring/gel-scoring"], function(ProcessChoice, Reracking, GelScoring) {
  "use strict";

  return function(context) {
    return new ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", id: "re-racking", constructor: Reracking},
        {label: "Gel Scoring", id: "gel-scoring", constructor: GelScoring}
      ]
    }, context));
  };
});
