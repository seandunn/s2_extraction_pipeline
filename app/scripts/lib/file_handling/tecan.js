//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([ "lib/underscore_extensions"
], function() {
  "use strict";
  /* Helper functions */
  function getPlateSize(labware) {
    return labware.number_of_rows * labware.number_of_columns;
  }
  /* Stages: */
  /* Stage1: Layout constructor */
  function buildEmptyLayout(username, date, sourceList, destination) {
    var initialValue =
      { source : {}, target : {}, user : (username ? username : "defaultUser"),
        time : (date ? date : (new Date()).toString())
      };
    initialValue.target[destination.labels.barcode.value] =
      { mapping : [], plateSize : getPlateSize(destination)
      };
    return initialValue;
  }
  /* Stage2: Layout strategies */
  function layoutColumnMajorOrder(sourceList, destination, layout) {
    function nextPositionIterator(destination) {
      var keysList = [];
      for ( var i = 0; i < destination.number_of_rows; i++) {
        for ( var j = 0; j < destination.number_of_columns; j++) {
          keysList.push([ String.fromCharCode("A".charCodeAt(0) + i),
              String.fromCharCode("1".charCodeAt(0) + j)
          ].join(""));
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
      return _.pairs(source.tubes).reduce(
        function(layout, tube) {
          if (_.isUndefined(destinationMapping)) {
            destinationMapping =
            layout.target[destination.labels.barcode.value].mapping;
          }
          destinationMapping.push(
            { srcWell : [ source.labels.barcode.value, tube[0]
            ], targetWell : nextPosition()
            });
          layout.source[source.labels.barcode.value] =
            { plateSize : getPlateSize(source)
            };
          return layout;
        }, layout);
    }, layout);
  }
  /* Stage3: Output strategies */
  function workingDilution(sourceList, destination, layout) {
    _.each(layout.target, function(target) {
      _.each(target.mapping, function(mapping) {
        mapping.buffer = 2.0;
        mapping.amount = 23.0;
      });
    });
    return layout;
  }
  /* Stage4: Tecan file generation */
  function tecanFile(layout) {
    return _.compose(_.partial(footer, layout), _.partial(buffers, layout),
      _.partial(separator, layout), _.partial(dynMappings, layout),
      _.partial(header, layout))(layout);
  }
  function separator(obj, text) {
    return text + "C;\n";
  }
  /* File Generation functions */
  function header(data) {
    return [ "C;\nC; This file created by ", data.user, " on ", data.time,
        "\nC;\n"
    ].join("");
  }
  function dynMappings(obj, text) {
    var mappingByWell = [];
    var dynamicMappings = "";
    _.chain(obj.target).each(
      function(destData, destBarcode) {
        _.each(destData.mapping, function(mapping) {
          mappingByWell[descriptionToVerticalPlatePosition(mapping.targetWell,
            destData.plateSize)] = mapping;
        });
        _.chain(mappingByWell).each(
          function(mapping) {
            var sourceBarcode = mapping.srcWell[0];
            var sourceName = obj.source[sourceBarcode].name;
            var sourcePosition =
            descriptionToVerticalPlatePosition(mapping.srcWell[1],
              obj.source[mapping.srcWell[0]].plateSize);
            var destinationPosition =
            descriptionToVerticalPlatePosition(mapping.targetWell,
              destData.plateSize);
            dynamicMappings +=
            [ "A", sourceBarcode, "", sourceName, sourcePosition, "",
                mapping.amount + "\nD", destBarcode, "", destData.name,
                destinationPosition, "", mapping.amount + "\nW", "\n"
            ].join(";");
          });
      });
    return text + dynamicMappings;
  }
  function descriptionToVerticalPlatePosition(wellDescription, plateSize) {
    return _.chain(
      [
        { row : (wellDescription.charCodeAt(0) - ("A".charCodeAt(0))),
          col : parseInt(wellDescription.substring(1), 10)
        }
      ]).map(
      function(splitWell) {
        var PLATE_DIMENSIONS =
          { "96" :
            { width : 12, height : 8
            }, "384" :
            { width : 24, height : 16
            }
          };
        return (PLATE_DIMENSIONS[plateSize].height * (splitWell.col - 1)) +
        splitWell.row + 1;
      }).value()[0];
  }
  function buffers(obj, text) {
    var buffer = [];
    var mappingByWell = [];
    _.chain(obj.target).each(
      function(destData, destBarcode) {
        mappingByWell = [];
        _.each(destData.mapping, function(mapping) {
          mappingByWell[descriptionToVerticalPlatePosition(mapping.targetWell,
            destData.plateSize)] = mapping;
        });
        _.chain(mappingByWell).each(
          function(mapping) {
            var destName = obj.target[destBarcode].name;
            var bufferAmount = mapping.buffer;
            var vertMapId =
            descriptionToVerticalPlatePosition(mapping.targetWell,
              destData.plateSize);
            buffer.push([ "A", "BUFF", "", "96-TROUGH", vertMapId, "",
                bufferAmount + "\nD", destBarcode, "", destName, vertMapId, "",
                bufferAmount + "\nW", ""
            ].join(";"));
          });
      });
    return text + buffer.join("\n");
  }
  function footer(obj, text) {
    var footerText = "\nC;\n";
    _.chain(obj.target).values().reduce(function(value, dest) {
      return value.concat(dest.mapping);
    }, []).filter(
      function(mapWell) {
        return !_.isUndefined(mapWell.srcWell) &&
        !_.isUndefined(mapWell.srcWell[0]);
      }).map(function(mapWell) {
      return mapWell.srcWell[0];
    }).uniq().reduce(function(barcodeLookup, plate, index) {
      barcodeLookup[plate] = index + 1;
      return barcodeLookup;
    }, {}).pairs().sort(function(a, b) {
      return a[1] > b[1];
    }).each(function(barcodeInfo) {
      footerText += [ "C; SCRC", barcodeInfo[1], " = ", barcodeInfo[0], "\n"
      ].join("");
    });
    footerText += "C;\n";
    _.chain(obj.target).keys().reduce(function(barcodeLookup, keyPlate, index) {
      barcodeLookup[keyPlate] = index + 1;
      return barcodeLookup;
    }, {}).pairs().sort(function(a, b) {
      return a[1] > b[1];
    }).each(function(barcodeInfo) {
      footerText += [ "C; DEST", barcodeInfo[1], " = ", barcodeInfo[0], "\n"
      ].join("");
    });
    return text + footerText;
  }
  var tecanImpl =
    {
      /**
             * Main action of tecan generation file. Executes a layout process
             * and returns a string with tecan file contents
             * 
             * @param sources:
             *        Array of labware elements that will be source in transfer
             * @param destination:
             *        Single labware that acts as destination in transfer
             * @param username:
             *        name of user to be printed in file generated
             * @param date:
             *        timestamp for printing in file generated
             * @return: a string with the contents of the tecan file
             */
      to : function(sources, destination, /* optional */username, /* optional */
      date) {
        tecanImpl.setConfig(username, date, layoutColumnMajorOrder,
          workingDilution, tecanFile);
        return tecanImpl.to.apply(this, arguments);
      },
      /**
             * Modifies behaviour of main tecan method (to) by changing its
             * stages implementation.
             * 
             * @param username:
             *        name of user to be printed in file generated date:
             *        timestamp for printing in file generated
             * @param layoutStrategy:
             *        assigns wells from sources to wells in destination
             * @param outputStrategy:
             *        defines amount of buffer and volume that will be
             *        transferred for each well
             * @param fileGeneration:
             *        parses config object and returns a string with the
             *        contents of the tecan file
             * @return: a string with the contents of the tecan file
             */
      setConfig : function(username, date, layoutStrategy, outputStrategy,
        fileGeneration) {
        tecanImpl.to =
        _.partial(function(layoutStrategy, outputStrategy, fileGeneration,
          sources, destination) {
          return _.compose(fileGeneration,
            _.partial(outputStrategy, sources, destination),
            _.partial(layoutStrategy, sources, destination),
            _.partial(buildEmptyLayout, username, date, sources, destination))
          ();
        }, layoutStrategy, outputStrategy, fileGeneration);
        return tecanImpl.to;
      },
      /**
             * Parses a config object and returns a string with the contents of
             * the tecan file
             * 
             * @arguments: data: JS object with the configuration of the file to
             *             generate
             * @return: a string with the contents of the tecan file
             */
      parse : tecanFile
    };
  return tecanImpl;
});
