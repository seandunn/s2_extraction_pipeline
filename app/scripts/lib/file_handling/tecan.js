define(
        [ 'lib/underscore_extensions' ],
        function() {
            'use strict';
                        
            function getCherryPickableDefaultName() {
                //PlatePurpose.cherrypickable_default_type.first.name.replace(/_/, "\s");
                return 'default name';
            }
            
            function header(data) {
                return "C;\nC; This file created by "+ data.user + " on " + data.time + "\nC;\n";
            }
            
            
            function dynMappings(obj){
                var mappingByWell = [];
                var dyn_mappings = '';
                _.chain(obj.destination).each(function(destData, destBarcode) {
                    _.each(destData.mapping, function(mapping) {
                        mappingByWell[descriptionToVerticalPlatePosition(mapping.dst_well, destData.plate_size)] = mapping;
                    });
              
                _.chain(mappingByWell).each(function(mapping, dest_position) {
                    var source_barcode = mapping.src_well[0];
                    var source_name = obj.source[source_barcode].name;
                    var source_position  = descriptionToVerticalPlatePosition(mapping.src_well[1], obj.source[mapping.src_well[0]].plate_size);
                    var destination_position = descriptionToVerticalPlatePosition(mapping.dst_well, destData.plate_size);
                    dyn_mappings += ["A", source_barcode, "", source_name, source_position, "", mapping.volume + "\nD", 
                       destBarcode, "", destData.name, destination_position, "", mapping.volume + "\nW", "\n"].join(";");
                    
                });
                });
                return dyn_mappings;
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
            
            function buffers(obj, total_volume) {
                var buffer = [];
                var mappingByWell = [];
                _.chain(obj.destination).each(function(destData, destBarcode){
                    _.each(destData.mapping, function(mapping) {
                        mappingByWell[descriptionToVerticalPlatePosition(mapping.dst_well, destData.plate_size)] = mapping;
                    });
                    _.chain(mappingByWell).each(function(mapping, dest_position) {
                        if (total_volume > mapping.volume)
                            {
                            var dest_name = obj.destination[destBarcode].name;
                            var volume = ((total_volume*100) - Math.floor((mapping.volume * 100)))/100;
                            var vert_map_id = descriptionToVerticalPlatePosition(mapping.dst_well, destData.plate_size);
                            buffer.push(["A", "BUFF", "", "96-TROUGH", vert_map_id, "", volume, "\nD", destBarcode, "", dest_name, 
                                           vert_map_id, "", volume+"\nW", ""].join(';'));
                            }
                    });
                    });
                return buffer.join("\n");
            }

        function footer(obj) {
            var footerText = "C;\n";
            
            _.chain(obj.destination).reduce(function(barcodeLookup, plate, index) {
                barcodeLookup[plate[0]] = index + 1;
                return barcodeLookup;
            }, {}).pairs().sort(function(a,b) { return a[1] < b [1]; })            
            .each(function(barcode, index) {
                footerText += ["C; SCRC", index, " = ", barcode, "\n"].join('');
            });
            
            footerText += "C;\n";
            
            _.chain(obj.destination).values().reduce(function (value, dest) { return value.concat(dest.mapping); }, [])
                .filter(function(mapWell) { return !_.isUndefined(mapWell.src_well) && !_.isUndefined(mapWell.src_well[0]);})
                .map(function(mapWell) { return mapWell.src_well[0];})
            .uniq().reduce(function(barcodeLookup, plate, index) {
                barcodeLookup[plate] = index + 1;
                return barcodeLookup;
            }, {}).sort(function(a,b) { return a[1] <= b[1]; })
                .each(function(barcode, index) {
                    footerText += ["C; DEST", index, " = ", barcode, "\n"].join('');
            });
            
            return footerText;
        }
        var bufSeparator =  "C;";
            return {
                parse: function(obj, total_volume) {
                    return header(obj) + dynMappings(obj) + bufSeparator + buffers(obj, total_volume) + footer(obj);
                },
                to : function(userName, date, requests) {
                return objToTecanFile(_
                        .chain(requests)
                        .filter(function(request) {
                            return request.state === 'passed';
                        })
                        .reduce(
                                function(obj, item) {
                                    var plateSrc = item.asset.plate;
                                    var plateDst = item.target_asset.plate;
                                    obj.source[plateSrc.ean13_barcode] = {
                                        "name" : plateSrc.stock_plate_name.replace(/_/, " "),
                                        "plate_size" : plateSrc.size };
                                    obj.destination[plateDst.ean13_barcode] = {
                                        "name" : getCherryPickableDefaultName(),
                                        "plate_size" : plateDst.size };
                                    if (_
                                            .isUndefined(obj.destination[plateDst.ean13_barcode].mapping)) {
                                        obj.destination[plateDst.ean13_barcode].mapping = [];
                                    }
                                    obj.destination[plateDst.ean13_barcode].mapping
                                            .push({
                                                "src_well" : [
                                                        plateSrc.ean13_barcode,
                                                        item.asset.map.description ],
                                                "dst_well" : item.target_asset.map.description,
                                                "volume" : (item.target_asset.get_picked_volume) });
                                    return obj;
                                },
                                { user : userName, time : date,
                                    source : {}, destination : {} })
                                    );
            } };
        });
