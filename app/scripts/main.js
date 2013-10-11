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
  "lib/file_handling/tecan",
  "lib/bootstrap-shim"
], function ($, _, App, ControllerFactory, tecan) {
  "use strict";
  var data2 = {
          "user" : "xyz987",
          "time" : "Fri Nov 27 10:11:13 2009",
          "source" : {
            "122289" : {
              "name" : "ABgene 0765",
              "plate_size" : 96,
            },
            "80785" :{
              "name" : "ABgene 0765",
              "plate_size" : 96,
            },
            "122290" : {
              "name" : "ABgene 0765",
              "plate_size" : 96,
            }
          },
          "destination" : {
            "127073" : {
              "name" : "ABgene 0800",
              "plate_size" : 96,
              "mapping" : [
                  { "src_well" :  ["122289", "G7"], "dst_well" : "D4", "volume" : 3.33   },
                  { "src_well" :  ["80785", "A1"],  "dst_well" : "E4", "volume" : 13     },
                  { "src_well" :  ["122289", "H7"], "dst_well" : "F4", "volume" : 3.27   },
                  { "src_well" :  ["122290", "A1"], "dst_well" : "E9", "volume" : 2.8    },
                  { "src_well" :  ["122290", "B1"], "dst_well" : "F9", "volume" : 4.08   }
                  ]
            }
          }
;
    var data = [ {
        state: 'passed',
        asset : {
            plate : { ean13_barcode : '2222', stock_plate_name : '333',
                size : '333' }, map : { description : "asdfasfda" } },
        target_asset : {
            plate : { ean13_barcode : '2222', stock_plate_name : '333',
                size : '333' }, map : { description : "jkljkjkljk" },
            getPickedVolume : "33" } } ];
  console.log(tecan.to('prueba', new Date(), data));
  //var theApp = new App(new ControllerFactory());
});

