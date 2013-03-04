define([], function() {

  var TubeRemovalView = function(owner, jquerySelector) {
    if(!jquerySelector) { debugger; }
    this.owner = owner;
    this.jquerySelector = jquerySelector;
  };

  TubeRemovalView.prototype.render = function(model) {
    var parent = this.jquerySelector();

    this.attachHtml(parent, model);
    this.attachEvents(parent, model);
  };

  TubeRemovalView.prototype.attachHtml = function(parent, model) {
    var waiting = '<p>Loading tube...</p>',
    uuid = (model && model.tube && 
      model.tube.uuid ) || 'unknown',

    parts = [ '<div style="float: none">',
        '<div style="float: none;" class="placeholder"/>',
	      '<button>Remove</button>',
          '</div>'],
    innerHtml = (model == undefined) ? waiting : parts.join('');
    parent.empty().append(innerHtml);
  };

  TubeRemovalView.prototype.attachEvents = function(parent, model) {
    var button = parent.find("button"),
    owner = this.owner;
    button.on('click', function(e) {
      owner.childDone(owner, "removeTube", model);
    });
  };

  TubeRemovalView.prototype.clear = function() {
    this.jquerySelector().empty();
  };

  return TubeRemovalView;

});
