define([ 'lib/underscore_extensions' ], function() {
  'use strict';
                      
  var tecanImpl = {
          /**
           *  Main action of tecan generation file. Executes a layout process and returns a string with tecan file contents 
           *  @arguments:
           *  sources: Array of labware elements that will be source in transfer
           *  destination: Single labware that acts as destination in transfer
           *  username: name of user to be printed in file generated
           *  date: timestamp for printing in file generated
           *  @return: a string with the contents of the tecan file
           **/
          to: function(sources, destination, /* optional */ username, /* optional */ date) {
              tecanImpl.setConfig(username, date, layoutColumnMajorOrder, workingDilution, tecanFile);
              return tecanImpl.to.apply(this, arguments);
          },
          
          /**
           * Modifies behaviour of main tecan method (to) by changing its stages implementation.
           * @arguments:
           * username: name of user to be printed in file generated
           * date: timestamp for printing in file generated
           * layoutStrategy: assigns wells from sources to wells in destination
           * outputStrategy: defines amount of buffer and volume that will be transferred for each well
           * fileGeneration: parses config object and returns a string with the contents of the tecan file
           * @return: a string with the contents of the tecan file
           */
          setConfig: function(username, date, layoutStrategy, outputStrategy, fileGeneration) {
              tecanImpl.to = _.partial(function(layoutStrategy, outputStrategy, fileGeneration, sources, destination) {
                  return _.compose(
                          fileGeneration, 
                          _.partial(outputStrategy, sources, destination), 
                          _.partial(layoutStrategy, sources, destination), 
                          _.partial(buildEmptyLayout, username, date, sources, destination))();
              }, layoutStrategy, outputStrategy, fileGeneration);
              return tecanImpl.to;
          },
          /**
           * Parses a config object and returns a string with the contents of the tecan file
           * @arguments:
           * data: JS object with the configuration of the file to generate
           * @return: a string with the contents of the tecan file
           */
          parse: tecanFile
  };
  
  return tecanImpl;
 
  /* Helper functions */
  function getPlateSize(labware) {
      return labware.number_of_rows*labware.number_of_columns;
  }  
  
  /* Stages: */
  /* Stage1: Layout constructor */
  function buildEmptyLayout(username, date, sourceList, destination) {
      var initialValue = { source: {}, target: {} };
      initialValue.user = (username ? username: 'defaultUser');
      initialValue.time = (date ? date: (new Date()).toString());
      initialValue.target[destination.labels.barcode.value] = { 
              mapping: [], 
              plateSize:  getPlateSize(destination) 
      };
      return initialValue;
  }  
  
  /* Stage2: Layout strategies */
  function layoutColumnMajorOrder(sourceList, destination, layout) {      
      function nextPositionIterator(destination) {
          var keysList=[];
          for (var i=0; i<destination.number_of_rows; i++) {
              for (var j=0; j<destination.number_of_columns; j++) {
                  keysList.push([String.fromCharCode('A'.charCodeAt(0)+i),
                                 String.fromCharCode('1'.charCodeAt(0)+j)].join(''));
              }
          }
          return _.partial(function(keys) {
            return keys.shift();
          }, _.filter(keysList, function(val) {
              return !(val in _.keys(destination.tubes));
          }));
      }
      
      var nextPosition = nextPositionIterator(destination);
      var destinationMapping;
      return _.reduce(sourceList, function(layout, source) {
          return _.pairs(source.tubes).reduce(function(layout, tube) {
              if (_.isUndefined(destinationMapping)) {
                  destinationMapping = layout.target[destination.labels.barcode.value].mapping;                  
              }
              destinationMapping.push({
                  srcWell: [ source.labels.barcode.value, tube[0] ],
                  targetWell: nextPosition()
              });
              layout.source[source.labels.barcode.value] = {
                      plateSize: getPlateSize(source)
              };
              return layout;
          }, layout);
      }, layout);
  }

  /* Stage3: Output strategies */
  function workingDilution(sourceList, destination, layout) {
      _.each(layout.target, function(target) {
          _.each(target.mapping, function(mapping) {
              mapping.buffer=2.0;
              mapping.amount=23.0;
          });
      });
      return layout;
  }
  
  /* Stage4: Tecan file generation */
  function tecanFile(layout) {
      return _.compose(
              _.partial(footer, layout),  
              _.partial(buffers, layout), 
              _.partial(separator, layout), 
              _.partial(dynMappings, layout), 
              _.partial(header, layout))(layout);
  }
  
  function separator(obj, text) {
      return text + "C;\n";      
  }
  
  /* File Generation functions */                  
  function header(data) {
      return "C;\nC; This file created by " + data.user + " on " + data.time + "\nC;\n";
  }
                
  function dynMappings(obj, text){
      var mappingByWell = [];
      var dyn_mappings = '';
      _.chain(obj.target).each(function(destData, destBarcode) {
          _.each(destData.mapping, function(mapping) {
              mappingByWell[descriptionToVerticalPlatePosition(mapping.targetWell, destData.plateSize)] = mapping;
          });

          _.chain(mappingByWell).each(function(mapping, dest_position) {
              var source_barcode = mapping.srcWell[0];
              var source_name = obj.source[source_barcode].name;
              var source_position  = descriptionToVerticalPlatePosition(mapping.srcWell[1], 
                      obj.source[mapping.srcWell[0]].plateSize);
              var destination_position = descriptionToVerticalPlatePosition(mapping.targetWell, destData.plateSize);
              dyn_mappings += ["A", source_barcode, "", source_name, source_position, "", 
                               mapping.amount + "\nD", destBarcode, "", destData.name, destination_position, "", 
                               mapping.amount + "\nW", "\n"].join(";");

          });
      });
      return text + dyn_mappings;
  }

  function descriptionToVerticalPlatePosition(wellDescription, plateSize) {
      return _.chain([{
          row: (wellDescription.charCodeAt(0) - ('A'.charCodeAt(0))),
          col: parseInt(wellDescription.substring(1), 10)
      }]).map(function(splitWell) { 
          var PLATE_DIMENSIONS = {
                  '96': { width: 12, height: 8},
                  '384': {width: 24, height: 16}
          };
          return (PLATE_DIMENSIONS[plateSize].height * (splitWell.col - 1 )) + splitWell.row + 1; 
      }).value()[0];
  }
                
  function buffers(obj, text) {
      var buffer = [];
      var mappingByWell = [];
      _.chain(obj.target).each(function(destData, destBarcode){
          mappingByWell=[];
          _.each(destData.mapping, function(mapping) {
              mappingByWell[descriptionToVerticalPlatePosition(mapping.targetWell, destData.plateSize)] = mapping;
          });
          _.chain(mappingByWell).each(function(mapping, dest_position) {
              var destName = obj.target[destBarcode].name;
              var bufferAmount = mapping.buffer;
              var vert_map_id = descriptionToVerticalPlatePosition(mapping.targetWell, destData.plateSize);
              buffer.push(["A", "BUFF", "", "96-TROUGH", vert_map_id, "", 
                           bufferAmount+"\nD", destBarcode, "", destName, 
                           vert_map_id, "", bufferAmount+"\nW", ""].join(';'));
          });
      });
      return text + buffer.join("\n");
  }

  function footer(obj, text) {
      var footerText = "\nC;\n";

      _.chain(obj.target).values().reduce(function (value, dest) { return value.concat(dest.mapping); }, [])
      .filter(function(mapWell) { return !_.isUndefined(mapWell.srcWell) && !_.isUndefined(mapWell.srcWell[0]);})
      .map(function(mapWell) { return mapWell.srcWell[0];})
      .uniq().reduce(function(barcodeLookup, plate, index) {
          barcodeLookup[plate] = index + 1;
          return barcodeLookup;
      }, {}).pairs().sort(function(a,b) { return a[1] > b[1]; })
      .each(function(barcodeInfo) {
          footerText += ["C; SCRC", barcodeInfo[1], " = ", barcodeInfo[0], "\n"].join('');
      });

      footerText += "C;\n";

      _.chain(obj.target).keys().reduce(function(barcodeLookup, keyPlate, index) {
          barcodeLookup[keyPlate] = index + 1;
          return barcodeLookup;
      }, {}).pairs().sort(function(a,b) { return a[1] > b [1]; })            
      .each(function(barcodeInfo) {
          footerText += ["C; DEST", barcodeInfo[1], " = ", barcodeInfo[0], "\n"].join('');
      });
      return text + footerText;
  }
});
