define([], function () {

  var TubeRemovalView = function (owner, jquerySelector) {
    if (!jquerySelector) {
      debugger;
    }
    this.owner = owner;
    this.jquerySelector = jquerySelector;
  };



  TubeRemovalView.prototype.render = function (model) {
     /*
     * input_model = {
     *
     *   uuid : "1234567890"  // the uuid to locate the resource
     * }
     *
     */
    var parent = this.jquerySelector();

    this.attachHtml(parent, model);
    this.attachEvents(parent, model);
  };

  TubeRemovalView.prototype.attachHtml = function (parent, model) {
    if (!parent) {
      // TODO: Add an exception
      debugger;
      return;
    }

    var innerHtml = undefined;

    if (!model){
      innerHtml = '<p>Loading tube...</p>';
    }
    else{
      innerHtml = [ '<div style="float: none">',
          '<div style="float: none;" class="placeholder"/>',
          '<button>Remove</button>',
          '</div>'].join('');
    }

    parent.empty().append(innerHtml);
  };

  TubeRemovalView.prototype.attachEvents = function (parent, model) {
    var button = parent.find("button"),
      owner = this.owner;
    button.on('click', function (e) {
      owner.childDone(owner, "removeTube", model);
    });
  };

  TubeRemovalView.prototype.clear = function () {
    this.jquerySelector().empty();
  };

  return TubeRemovalView;

});
