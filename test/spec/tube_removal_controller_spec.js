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
