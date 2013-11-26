define([
       'app-components/bed-recording/bed-recording',
       'lib/pubsub', 
       'lib/Util'
], function (BedRecording, PubSub, Util) {
  'use strict';

  var BedController = function (owner, controllerFactory) {
    this.owner = owner;
    this.controllerFactory = controllerFactory;
    return this;
  };

  var ROOT_INSTANCE;
  BedController.prototype.init = function (inputModel, handlerThen) {
    this.model = inputModel;
    if (_.isUndefined(ROOT_INSTANCE))
      {
        ROOT_INSTANCE = inputModel.root;  
      }
    this.component = BedRecording(ROOT_INSTANCE);
    handlerThen();
    return this;
  };

  BedController.prototype.renderView = function () {
    this.component.view.on(this.component.events);

    this.component.view.on("done.bed-recording.s2", $.ignoresEvent(_.bind(function(view, bedBarcode, plateLabware) {
      var value = plateLabware.labels.barcode.value;
      if (value.match(/\d{12}/))
      {
        value = Util.pad(value);
      }
    
      var msg = {
      modelName: this.owner.labwareModel.expected_type.pluralize(),
      BC:        value
    };
      this.owner.updateModel(plateLabware);

      this.owner.owner.childDone(this.owner, 'barcodeScanned', msg);      
      
      PubSub.publish("s2.labware.barcode_scanned", this.owner, msg);      
    }, this)));

    
    return this.component.view;
  };
  
  BedController.prototype.getComponentInterface = function() {
    return this.component;
  };

  return {
    register:function (callback) {
      callback('bed_controller', function (owner, factory) {
        return new BedController(owner, factory);
      });
    }
  };
});

