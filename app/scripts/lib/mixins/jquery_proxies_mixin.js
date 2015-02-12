//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([], function() {

  function JqueryProxies($el) {
    return {
      enable: $.proxy($el, "attr", "disabled", false),
      disable: $.proxy($el, "attr", "disabled", true),
      on: $.proxy($el, "on"),
      off: $.proxy($el, "off")
    }
  }

  return JqueryProxies;
});
