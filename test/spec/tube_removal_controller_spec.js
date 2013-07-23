define(['presenters/tube_removal_presenter'], function(TubeRemovalPresenter) {
  'use strict';

  describe('TubeRemovalPresenter', function() {
    describe('default presenter setup', function() {

      var createFakeOwner = function() {
	var fakeOwner = {
	  childDone: function(presenter, action, data) {}
	};

	spyOn(fakeOwner, 'childDone');
	return fakeOwner;
      }

      it("child done delegates removeTube message to owner", function() {
	var owner = createFakeOwner(),
	presenter = new TubeRemovalPresenter(owner);
	
	presenter.childDone(presenter, "removeTube", "fakeData");

	expect(owner.childDone).toHaveBeenCalledWith(presenter, "removeTube", "fakeData");
      });
    });
  });
});
