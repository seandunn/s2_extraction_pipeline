//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([ "models/base_page_model", "config"
], function(BasePageModel, AppConfig) {
  "use strict";
  
  var Model = Object.create(BasePageModel);
  $.extend(Model, { 
    init : function(owner, config) {
      this.owner = owner;
      this.config = config;
      this.robotSaved = false;

            
      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },
    getRobotType: function() {
      return this.config.group;
    },
    
    setupModel : function(setupData) {
      this.cache.push(setupData.batch);
      this.batch = setupData.batch;
      return $.Deferred().resolve(this).promise();
    },

    setRobotFromBarcode : function(robotBarcode) {
      var deferred = $.Deferred();
      var thisModel = this;

      if (thisModel.batch.robot) {
        if (thisModel.batch.robot === robotBarcode) {
          thisModel.robotSaved = true;
          thisModel.robot.barcode = robotBarcode;
          this.setSelectedRobot(robotBarcode);
          return deferred.resolve(thisModel);
        } else {
          return deferred.reject(
            { message : "The scanned robot is not the one previously used."
            });
        }
      } else {
        this.Model.batch.update(
          { robot : robotBarcode
          }).fail(function() {
          deferred.reject(
            { message : "Unable to save the robot details."
            });
        }).then(function() {
          thisModel.robotSaved = true;
          thisModel.robot.barcode = robotBarcode;
          this.setSelectedRobot(robotBarcode);
          deferred.resolve(thisModel);
        });
      }
      return deferred.promise();
    }
  });
  return Model;
});
