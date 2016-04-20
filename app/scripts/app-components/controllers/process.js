//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define(["app-components/layouts/biorobot"], function(biorobotLayout) {
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
    this.model.operate(action, this.getRowsConnectedForOperations(), biorobotLayout.layoutDistribution).then(_.bind(function() {
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
