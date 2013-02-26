define([], function() {

  var TubeRemovalView = function(owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;
  };

  TubeRemovalView.prototype.render = function(model) {

    var parent = this.jquerySelector(),
    waiting = '<td><p>Loading tube...</p></td>',
    // This is wrong, but let's display something
    uuid = model && model.rawJson && model.rawJson.tube && 
      model.rawJson.tube.uuid,
    parts = [ '<td colspan="2">',
	      '<p> Tube uuid: ', uuid, '</p>',
	      '</td>',
	      '<td><button>Remove</button></td>'],
    innerHtml = (model == undefined) ? waiting : parts.join('');
    console.log("model is ", model);
    parent.empty().append(innerHtml);
  };

  TubeRemovalView.prototype.clear = function() {
    this.jquerySelector().empty();
  };

  return TubeRemovalView;

});
