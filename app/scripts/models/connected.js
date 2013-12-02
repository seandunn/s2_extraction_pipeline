define([
  "models/base_page_model",
  "mapper/operations",
  "connected/behaviours",
  "connected/missing_handlers",
  "connected/caching",
  "lib/barcode_checker"
], function(Base, Operations, Behaviour, Missing, Cache, BarcodeChecker ) {
  "use strict";

  var Model = Object.create(Base);

  _.extend(Model, {
    init: function(owner, config) {
      var instance = this;
      this.className = "ConnectedModel";

      this.owner = owner;
      this.previous = false;
      this.ready    = false;

      this.config  = config;                                    // Configuration of our connections
      this.started = false;                                     // Has the process started

      // Configure the behaviours based on the configuration
      this.behaviours = _.chain(this.config.behaviours).map(function(behaviourName, name) {
        return [name, Behaviour(behaviourName)];
      }).object().value();

      // Configure the behaviour of inputs & outputs from configuration
      _.extend(this, _.chain(["inputs","outputs"]).map(function(cacheName) {
        var name = (config.cache || {})[cacheName] || "singular(report)";
        var missingHandler = _.bind(Missing(name), instance);
        var cache = _.extend(Cache.init(), {
          getByBarcode: function(requester, modelName, barcode) {
            return this.get(
              function(r)   { // Find by barcode && resourceType
                return (r.labels.barcode.value === barcode) && (r.resourceType.pluralize() === modelName);
              },
              function(p,f) { return missingHandler(modelName, barcode, p, f); }  // Use the missing handler!
            ).done(_.bind(requester.updateModel, requester)).fail(_.bind(requester.displayErrorMessage, requester));
          }
        });

        return [cacheName, cache];
      }).object().value());

      this.initialiseCaching();
      return this;
    },

    setBatch: function(batch) {
      this.cache.push(batch);
      this.batch = batch;
      var deferred = $.Deferred();
      var thisModel = this;
      setupInputs(thisModel)
          .fail(function () {
            deferred.reject({message: "Couldn't load the batch resource"});
          })
          .then(function () {
            return setupOutputs(thisModel);
          })
          .fail(function () {
            deferred.reject({message: "Couldn't load the batch resource (Impossible to read outputs)"});
          })
          .then(function (reLoadedOutputs) {
            if (reLoadedOutputs.length > 0) {
              thisModel.reLoadedOutputs = reLoadedOutputs;
              thisModel.started = true;
            }
          })
          .then(function () {
            deferred.resolve(thisModel);
          });
      return deferred.promise();
    },

    setUser: function(user) {
      this.user = user;
      this.owner.childDone(this, "userAdded");
    },

    setupInputControllers: function(reset) {
      var model = this;
      return this.owner.getS2Root()
      .then(function(root){
        // Becareful! inputs is not a promise!
        return model.inputs.then(function(inputs) {
          model.owner.rowControllers = _.chain(inputs).map(function (input, index) {
            input = reset ? undefined : input;
            var rowController =
              model.owner.controllerFactory
              .create(
                (model.config.rowBehaviour === "bedVerification" || model.config.rowBehaviour === "bedRecording")?
                  "row_bed_controller" : "row_controller", model.owner);
            rowController.setupController(model.getRowModel(root,index, input), selectorFunction(model.owner, index));
            return rowController;
          })
          .value();
        });
      });

      function selectorFunction(controller, row) {
        return function() {
          return controller.jquerySelection().find(".row" + row);
        };
      }
    },

    getRowModel: function (root,rowNum, input) {
      var model = this, previous = this.previous && this.ready;
      var hasResourceForThisRow = false;
      if (model.started){
        hasResourceForThisRow = (model.reLoadedOutputs.length > 0);
      }
      return _.chain(this.config.output).pairs().sort().reduce(function(rowModel, nameToDetails, index) {
        var details = nameToDetails[1];
        var name    = "labware" + (index+2);  // index=0, labware1=input, therefore labware2 first output
        var resource;

        if (details.tracked === false) {
          // we can't reload an untracked resource, therefore, we create an empty one.
          resource         = root[details.model.pluralize()].instantiate();
          resource.tracked = false;
        } else if (hasResourceForThisRow) {
          resource = popAMatchingOutput(model,input,details.model.singularize(), details.barcodePrefixes);
        }

        rowModel[name] = {
          input:           false,
          resource:        resource,
          expected_type:   details.model.singularize(),
          barcodePrefixes: details.barcodePrefixes,
          display_remove:  previous,
          display_barcode: previous,
          title:           details.title,
          validation:      details.validation,
          bedTracking:     !!details.bedTracking
        };
        return rowModel;
      }, {
        rowNum: rowNum,
        enabled: previous,

        labware1: {
          input:           true,
          resource:        input,
          expected_type:   model.config.input.model.singularize(),
          display_remove:  previous,
          display_barcode: previous,
          title:           model.config.input.title,
          validation:      model.config.input.validation,
          bedTracking:     !!model.config.input.bedTracking
        }
      }).value();

      // used to restore the state of the transfer
      // this function SHOULD pop the output resource
      // 1. corresponding to an input resource
      // 2. and of the correct type
      // HOWEVER, the point number 1 is not fulfilled yet.
      // there is no way to know which input correspond to which output after the transfer has been completed.
      // it might be possible to do so if one can search for "transfers" on S2.
      // For now, it does not matter, as we don't really care, the transfer being already achieved at this stage...
      function popAMatchingOutput(model, inputLabware, outputResourceType, barcodePrefixes){
        var correspondingOutput = _.find(model.reLoadedOutputs, function(labware){
          return labware.resourceType === outputResourceType && checkPrefix(labware.labels.barcode.value, barcodePrefixes);
        });

        function checkPrefix(barcode, prefixes){
          if (!prefixes || ($.isArray(prefixes) && prefixes.length === 0) ) { return true; }
          return _.some(prefixes, function(prefix){
            return barcode.indexOf(prefix) === 0;
          });
        }
        model.reLoadedOutputs = _.without(model.reLoadedOutputs,correspondingOutput);
        return correspondingOutput;
      }
    },

    createOutputs: function(printer) {
      var model = this;
      this.behaviours.outputs.print(function() {

        model.owner.getS2Root()
        .then(function(root) {
          model.inputs.then(function(inputs) {
            var labels = [];
            var outputsCreated = [];

            var promises = _.chain(inputs)
            .map(function(input) {
              // For each input we have to create a number of outputs.  These outputs are effectively
              // tied together in some fashion and should be printed next to each other.  Hence, here
              // we build output structures, which we will then print.
              var output = { };

              var promises = _.chain(model.config.output)
              .pairs()
              .filter(function(outputNameAndDetails) {
                var details = outputNameAndDetails[1];

                return details.tracked === undefined ? true : details.tracked;
              })
              .map(function(outputNameAndDetails) {
                var details = outputNameAndDetails[1];

                return Operations
                .registerLabware(
                  root[details.model],
                  details.aliquotType,
                  details.purpose,
                  details.attributes
                )
                .then(function(state) {
                  model.cache.push(state.labware);
                  outputsCreated.push(state.labware);
                  output[details.title] = state.labware;
                  return state.labware;
                }, function() {
                  model.owner.childDone(model, "failed", {});
                });

              })
              .value();

              // We are only done once all of the outputs have been created and stuck into the output
              // structure.  At that point we can turn the output into an object that will behave like
              // it can be printed.  We'll assume that the template name can be made by joining the
              // template names for each label together (i.e. 2 "tube" labels mean "tube_and_tube", or
              // a "tube" and "spin_column" means "tube_and_spin_column").  So, whilst one "label" might
              // be sent to the printer, it might physically print a couple of labels.
              //
              // WARNING: Whilst this works for N alike things (N tubes for instance), or tuples (1 tube
              // and 1 spin column), it doesn't work multiple tuples, unless the template knows something
              // we don't.
              return $.when.apply(null, promises).done(function() {
                var label = _.chain(output).pairs().map(function(nameAndLabware) {
                  var labware = nameAndLabware[1];
                  var label   = labware.returnPrintDetails();

                  // Ensure that we have some way of determining what's what!
                  var details = label[labware.resourceType];
                  details["label_text"] = details["label_text"] || {};
                  details.label_text.role = nameAndLabware[0];

                  return {
                    template: label.template,
                    key:      labware.resourceType,
                    details:  details
                  };
                }).reduce(function(memo, label) {
                  memo.template.push(label.template);

                  var key = label.key;
                  if (memo[label.key] instanceof Array) {
                    memo[label.key].push(label.details);
                  } else if (memo[label.key]) {
                    memo[label.key] = [memo[label.key],label.details];
                  } else {
                    memo[label.key] = label.details;
                  }
                  return memo;
                }, {template:[]}).value();

                label.template = label.template.join("_and_");
                labels.push({
                  returnPrintDetails: function() {
                    return label;
                  }
                });
              });
            }).value();

            // Now we can print out special labels!
            $.when.apply(null, promises).then(function(placeholder) {
              model.outputs.resolve(outputsCreated).then(function(outputs) {
                model.printBarcodes(labels, printer);
              });
              model.owner.childDone(model, "outputsReady", labels);
            }).fail(function() {
              model.owner.childDone(model, "failed", {});
            });
          });
        });
      }, function() {
        model.outputs.resolve([]);
        model.owner.childDone(model, "outputsReady", {});
      });
    }, // end of createOutputs

    operate: function(happeningAt, controllers) {
      var model = this;
      var s2root;

      this.owner.getS2Root().then(function (result) {
        // STEP 1: We're going to need the root later!
        s2root = result;
        return result;
      }).then(function() {
        // STEP 2: Retrieve the items for the batch we're working with
        return model.batch.items;
      }).then(function(items) {
        // STEP 3: Map the controllers to the appropriate transfers that are required

        var sourceToOrder = _
        .chain(items)
        .reduce(function(memo, item) {
          memo[item.uuid] = item.order;
          return memo;
        }, {})
        .value();

        return _
        .chain(controllers)
        .reduce(function(memo, controller) {
          controller.handleResources(function(source) {

            var transferDetails = _
            .chain(arguments)
            .drop(1)
            .map(function(destination, index) {
              // if not_batch === true -> undefined
              // if not_batch === false -> model.batch.uuid
              // if not_batch === undefined -> model.batch.uuid
              var batchUUID = (!model.config.output[index].not_batched) ? model.batch.uuid : undefined;
              return {
                input: {
                  resource: source,
                  role: model.config.input.role,
                  order: sourceToOrder[source.uuid]
                },
                output: {
                  resource: destination,
                  role: model.config.output[index].role,
                  batch: batchUUID
                },
                fraction:     1.0,
                aliquot_type: model.config.output[index].aliquotType
              };
            })
            .value();

            if (source.transferBehaviour ==="plateLike") {
              // If we are using something plateLike then prepare multiple transfers
              // for each well, tube or window (this will overwrite the original
              // transfer.
              transferDetails = _
              .chain(source.tubes || source.windows || source.wells)
              .keys()
              .reduce(function(memo, location){
                memo.push({
                  input:            transferDetails[0].input,
                  output:           transferDetails[0].output,
                  aliquot_type:     transferDetails[0].aliquot_type,
                  source_location:  location,
                  target_location:  location,
                  amount:           2000, // 2000nl Currently only used by working
                                          // dilution creation but needs to be
                                          // moved to config file.
                });

              return memo;
            }, [])
            .value();

            }
            memo.push(transferDetails);
          });


          return memo;
        }, [])
        .flatten()
        .value();


      })
      .then(function(transferDetails) {
        // STEP 4: Setup the operation
        function transferType(source, destination){
          var transfer = _.find({
            "plateLike=>plateLike":  s2root.actions.transfer_plates_to_plates,
            "plateLike=>tubeTubes":  s2root.actions.transfer_wells_to_tubes,
            "tubeLike=>tubeLike":    s2root.actions.transfer_tubes_to_tubes
          }, function (transfer, key){
            return key === (source.transferBehaviour+"=>"+destination.transferBehaviour);
          });

          if (transfer === undefined) {
            throw "Transfer between: " + source.resourceType +
              " and " + destination.resourceType + " not defined.";
          }

          return transfer;
        }

        var source      = transferDetails[0].input.resource;
        var destination = transferDetails[0].output.resource;
        var transfer    = transferType(source, destination);



        return Operations.betweenLabware(
          transfer,
          _.map(transferDetails, function(details) {

            return function(operations) {
              operations.push(details);
              return $.Deferred().resolve();
            };

          })
        );

      })
      .then(function(operation) {
        // STEP 5: Override the behaviour of the operation so that we do the correct things
        var doNothing = function() { };
        _.each(["start","operate","complete"], function(event) {
          model.behaviours[event][happeningAt](function() {
            var handler = operation[event];
            operation[event] = function() {
              return handler.apply(this, arguments).then(function() {
                model.owner.childDone(model,event+"Operation",{});
              });
            };
          }, function() {
            operation[event] = doNothing;
          });
        });
        return operation;
      }).then(function(operation) {
        // STEP 6: Finally perform the operation and report the final completion
        operation.operation().then(function () {
          model.owner.childDone(model, "successfulOperation", controllers);
        }).fail(function() {
          model.owner.childDone(model, "failedOperation", {});
        });
      });
    }
  });

  return Model;

  // Configures the inputs
  function setupInputs(model) {
    return model.batch.items.then(function(items) {
      var inputs = [];
      return $.when.apply(null, _.chain(items).filter(function(item) {
        return item.role === model.config.input.role && item.status === "done";
      }).map(function(item) {
        return model.cache.fetchResourcePromiseFromUUID(item.uuid).then(function(resource) {
          inputs.push(resource);
        });
      }).value()).then(function() {
        model.inputs.resolve(inputs);
      }).fail(model.inputs.reject);
    });
  }

  // configure the reLoadedOutputs
  function setupOutputs(model) {
    return model.batch.items.then(function(items) {
      var deferred = $.Deferred();
      var reLoadedOutputs = [];
      $.when.apply(null, _.chain(items)
                   .filter(function (item) {
                     return item.status === "in_progress";
                   })
                   .filter(function (item) {
                     return _.reduce(model.config.output,function(memo, output){
                       return memo || (item.role === output.role);
                     },false);
                   })
                   .map(function (item) {
                     return model.cache.fetchResourcePromiseFromUUID(item.uuid).then(function (resource) {
                       reLoadedOutputs.push(resource);
                     });
                   }).value())
                   .then(function () {
                     return deferred.resolve(reLoadedOutputs);
                   })
                   .fail(function(){
                     deferred.reject({message:"Couldn't load the output resources!"});
                   });
                   return deferred.promise();
    });
  }


});
