//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
require.config({
  shim:{
    file_saver: {
      exports: "saveAs"
    }
  },

  baseUrl: "scripts",

  paths:{
    jquery:               "../components/jquery/jquery.min",
    jquery_cookie:        "../components/jquery-cookie/jquery.cookie",
    underscore:           "../components/underscore/underscore-min",
    underscore_string:    "../components/underscore.string/lib/underscore.string",
    bootstrap:            "../components/sass-bootstrap/js",
    text:                 "../components/requirejs-text/text",
    spinjs:               "../components/spin.js/spin",
    components:           "../components",
    labware:              "labware",
    mapper:               "../components/S2Mapper/app/scripts/mapper",
    mapper_services:      "../components/S2Mapper/app/scripts/services",
    mapper_test:          "../components/S2Mapper/test",
    mapper_testjson:      "../components/S2Mapper/test/json",
    event_emitter:        "../components/eventEmitter/EventEmitter",
    config:               "config",
    reception_templates:  "lib/reception_templates",
    images:               "../images",
    file_saver:           "../components/FileSaver/FileSaver"
  }
});

require([
  "jquery",
  "underscore",
  "app",
  "controllers/controller_factory",
  "lib/bootstrap-shim"
], function ($, _, App, ControllerFactory) {
  "use strict";

  new App(new ControllerFactory());
});
