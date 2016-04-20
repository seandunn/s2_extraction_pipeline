//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
/* global requirejs, mocha */
requirejs.config({
  shim: {
    file_saver: {
      exports: "saveAs"
    }
  },

  baseUrl:"../app/scripts",

  paths:{
    text:                 "../components/requirejs-text/text",
    spinjs:               "../components/spin.js/spin",
    domReady:             "../components/requirejs-domready/domReady",
    labware:              "labware",
    mapper:               "../components/S2Mapper/app/scripts/mapper",
    mapper_services:      "../components/S2Mapper/app/scripts/services",
    mapper_test:          "../components/S2Mapper/test",
    mapper_testjson:      "../components/S2Mapper/test/json",
    extraction_pipeline:  "",
    test:                 "../../test",
    config:               "../../test/test_config",
    spec:                 "../../test/spec",
    lib:                  "lib",
    pipeline_testjson:    "../../test/json",
    pipeline_testcsv:     "../../test/csv",
    reception_templates:  "lib/reception_templates",
    images:               "../../images",
    jquery:               "../components/jquery/jquery.min",
    underscore:           "../components/underscore/underscore-min",
    underscore_string:    "../components/underscore.string/lib/underscore.string",
    bootstrap:            "../components/sass-bootstrap/js",
    components:           "../components",
    event_emitter:        "../components/eventEmitter/EventEmitter",
    file_saver:           "../components/FileSaver/FileSaver"
  }
});

requirejs([
  "spec/maker_spec",
  "spec/vial_spec",
  "spec/underscore_extensions_spec",
  "spec/file_handling_spec",
  "spec/fake_user_spec",
  "spec/selection_page_model_spec",
  "spec/selection_page_spec",
  "spec/util_spec",
  "spec/racking_behaviour_spec",
  "spec/layouts/biorobot_spec"
], function () {
  "use strict";
  _.templateSettings.variable = "templateData";
  
  mocha.run();
});
