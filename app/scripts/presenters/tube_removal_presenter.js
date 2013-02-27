define(['extraction_pipeline/views/tube_removal_view'], function(TubeRemovalView) {
  
  var TubeRemovalPresenter = function(owner, presenterFactory) {
    this.model = null;
    this.owner = owner;
    this.presenterFactory = presenterFactory;
  };

  TubeRemovalPresenter.prototype.setupView = function(jquerySelector) {
    this.view = new TubeRemovalView(this, jquerySelector);
    this.jquerySelector = jquerySelector;
  };

  TubeRemovalPresenter.prototype.setModel = function(model) {
    var that = this;
    this.model = model;
    
    if(!this.tubePresenter) {
      this.tubePresenter = this.presenterFactory.createTubePresenter(model);
    }
    if(model) {
      this.tubePresenter.setupModel(model);
      this.tubePresenter.setupView(function() { 
	return that.jquerySelector().find("td :eq(0)"); 
      });
    }
  }

  TubeRemovalPresenter.prototype.render = function() {
    if (this.view) {
      this.view.render(this.model && this.model.rawJson);
      }
    if (this.tubePresenter) {
      this.tubePresenter.renderView();
    };
  }

  TubeRemovalPresenter.prototype.release = function() {
    if (this.view) {
      this.view.clear();
    }
  };

  TubeRemovalPresenter.prototype.childDone = function(presenter, action, data) {
    this.owner.childDone(presenter, action, data);
  };

  return TubeRemovalPresenter;

});
