define([], function() {

  var TubeRemovalView = function(owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;
  };

  TubeRemovalView.prototype.render = function(model) {

    var parent = this.jquerySelector();

    this.attachHtml(parent, model);
    this.attachEvents(parent, model);
  };

  TubeRemovalView.prototype.attachHtml = function(parent, model) {
    var waiting = '<td><p>Loading tube...</p></td>',
    uuid = (model && model.tube && 
      model.tube.uuid ) || 'unknown';

    parts = [ '<td colspan="2">',
	      '</td>',
	      '<td/>',
	      '<td><button>Remove</button></td>'],
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
