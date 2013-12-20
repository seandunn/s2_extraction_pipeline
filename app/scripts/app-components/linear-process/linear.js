define([ "text!app-components/linear-process/_component.html"
], function(partial) {
  return function(externalContext) {
    var obj =
      {
        components : [], pos : 0
      };
    var template = _.template(partial);
    var html = $(template());
    _.each(externalContext.components, function(elem) {
      var component = elem.constructor();
      component.view.on(component.events);
      html.append(component.view);
      obj.components.push(component);
    });
    html.on("done.s2", _.partial(function(obj) {
      obj.pos++;
      activate(obj);
    }), obj);
    var activate = _.partial(function(html, obj) {
      var pos = obj.pos;
      var components = obj.components;
      if (pos > 0) {
        components[pos - 1].view.trigger("deactivate.s2");
      }
      if (pos > components.length) {
        html.trigger("done.s2");
      } else {
        components[pos].view.trigger("activate.s2");
        components[pos].view.focus();
      }
    }, html, obj);
    return {
        view : html,
        events :
          {
            "focus" : activate,
            "activate" : $.ignoresChildrenEvent(html[0], _.partial(
              function(obj) {
                obj.pos = 0;
                activate();
              }, obj))
          }
      };
  };
});