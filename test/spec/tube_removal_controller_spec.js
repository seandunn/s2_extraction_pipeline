//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define(['controllers/tube_removal_controller'], function(TubeRemovalController) {
  'use strict';

  describe('TubeRemovalController', function() {
    describe('default controller setup', function() {

      var createFakeOwner = function() {
      	var fakeOwner = {
      	  childDone: function(controller, action, data) {}
      	};

      	spyOn(fakeOwner, 'childDone');
	      
        return fakeOwner;
      }

      it.skip("child done delegates removeTube message to owner", function() {
      	var owner = createFakeOwner(),
      	    controller = new TubeRemovalController(owner);
      	
      	controller.childDone(controller, "removeTube", "fakeData");

      	expect(owner.childDone).toHaveBeenCalledWith(controller, "removeTube", "fakeData");
      });
    });
  });
});
