define([
      'controllers/base_controller',
       'models/connected',
       'text!html_partials/_connected.html',
       'lib/pubsub'
], function(BaseController, Model, Template, PubSub) {
  'use strict';
  
  return $.extend({}, {
    checkPageComplete: _.partial(_.identity, true),
    start: _.partial(actionOperation, "start"),

    end:   _.partial(actionOperation, "end"),

    next:  function(){
      var controller = this;
      this.model.behaviours.done.next(_.bind(
        function(){ 
          this.emit("controllerDone", this);
          //controller.owner.childDone(controller, 'done'); 
          }, this),
        _.bind(actionOperation, this, "next")
      )
    },
    
    getRowsConnectedForOperations: function() {
      var output = this._outputsCreated[0];
      return _.map(this._plates, function(plate) {
        return {
          handleResources: function(callback) {
            callback.apply(null, [plate, output]);
          }
        }
      });
    }
  });
  
  function actionOperation(action) {
    if (this.checkPageComplete()) {
      this.model.operate(action, this.getRowsConnectedForOperations(), "A1").then(_.bind(function() {
        if (action==="start") {
          this.emit("processBegin");
          this.emit("transferStarted");
        } else {
          this.emit("transferCompleted");
          this.emit("processFinished");
        }        
      }, this));
      this.model.behaviours.done[action](_.bind(function() {
        this.owner.childDone(this, "done", {
          batch: this.model.batch,
          user: this.owner.config.login
        });
      }, this));
    }
  }
  
});
