define([], function() {
  'use strict';
  
  return $.extend({}, {
    start: _.partial(actionOperation, "start"),

    end:   _.partial(actionOperation, "end"),

    next:  function(){
      var controller = this;
      this.model.behaviours.done.next(_.bind(
        function(){ 
          this.emit("controllerDone", this);
          }, this),
        _.bind(actionOperation, this, "next")
      )
    },
    reload: function() {
      window.location.reload();
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
});
