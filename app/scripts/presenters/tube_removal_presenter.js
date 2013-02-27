define(['views/tube_removal_view'], function(TubeRemovalView) {
  
  var TubeRemovalPresenter = function(owner) {
    this.owner = owner;
    this.view = undefined;
    this.model = undefined;
  };

  TubeRemovalPresenter.prototype.setModel = function(model) {
    this.model = model;
  };

  TubeRemovalPresenter.prototype.setupView = function(selection) {
    this.view = new TubeRemovalView(this, selection);
  };

  TubeRemovalPresenter.prototype.render = function() {
    if (this.view) {
      this.view.render(this.model);
      }
  }

  TubeRemovalPresenter.prototype.release = function(selection) {
    if (this.view) {
      this.view.clear();
    }
  };

  TubeRemovalPresenter.prototype.childDone = function(presenter, action, data) {
  };

  return TubeRemovalPresenter;

});
