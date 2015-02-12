//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  return {
    // Similar to always, except that it behaves exactly as we need in most circumstances in that it
    // attaches the handler to both the resolve and reject states.
    regardless: function (deferred, handler) {
      return deferred.then(handler, handler);
    }
  };
});
