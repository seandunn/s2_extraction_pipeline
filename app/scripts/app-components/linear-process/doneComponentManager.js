define([], function() {
    'use strict';
    
    function DoneComponentManager(components) {
      this._components = components;
    }
    
    function isComponentDone(component) {
      return !!component.done;
    }
    
    function markComponentAsDone(component) {
      component.done = true;
    }
    
    function findComponentDoneByView(componentView) {
      var components = this._components;
      var queriedView = $(componentView);
      var doneComponent = _.find(components, function(c) {
          return c.view[0] === queriedView[0]
      });
      if (!_.isUndefined(doneComponent)) {
          markComponentAsDone(doneComponent);
      }
      return doneComponent;
    }
    
    function findNextComponentNotDoneByComponent(component) {
      var components = this._components;
      if (_.isUndefined(component)) {
          return;
      }
      var doneView = component.view;
      var findComponent = false;
      var firstComponentNotDone = null;
      var nextComponent = _.find(components, function(c) {
          if (!firstComponentNotDone && (!isComponentDone(c))) {
              firstComponentNotDone = c;
          }
          if (findComponent && (!isComponentDone(c))) {
              return true;
          } else {
              findComponent = (c.view[0] === doneView[0]);
          }
          return false;
      });
      if (!nextComponent && firstComponentNotDone) {
          return firstComponentNotDone;
      }
      return nextComponent;
    };
    
    var proto = DoneComponentManager.prototype;
    
    proto.isComponentDone = isComponentDone;
    proto.markComponentAsDone = markComponentAsDone;
    proto.findComponentDoneByView = findComponentDoneByView;
    proto.findNextComponentNotDoneByComponent = findNextComponentNotDoneByComponent;
    
    return DoneComponentManager;
});