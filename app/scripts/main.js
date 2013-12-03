require.config({
  shim:{

  },

  baseUrl: "scripts",

  paths:{
    jquery:               "../components/jquery/jquery.min",
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
    config:               "config",
    reception_templates:  "lib/reception_templates",
    images:               "../images"
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