define([
    'text!app-components/linear-process/_component.html',
    'app-components/linear-process/doneComponentManager'

  // Globally included stuff added after this comment
  , 'lib/jquery_extensions'
], function (componentView, DoneComponentManager) {
  'use strict';

  var componentContainer = _.compose($, _.template(componentView));
  
  return function(context) {
        var html = componentContainer(context);
        // Attach each of the components into the view.
        var components = _.chain(context.components).map(
                _.partial(buildComponent, context)).map(
                _.partial(attachComponent, html)).value();
        
        var doneComponentManager = new DoneComponentManager(components);
        html.on('s2.done', stopsEvent(_.partial(onDoneEventHandler, doneComponentManager, html)));
        return { 
                 view : html, 
                 events : { } 
        };
    };
    
    function stopsEvent(f) {
        return function() {
           var event = arguments[0];
            var value = f.apply(this, _.drop(arguments, 1));
            if (!value) {
              event.stopPropagation();
            }
            return value;
        };
    }
    
    function onDoneEventHandler(doneComponentManager, html, doneView) {
        // If I have thrown the Done event, do not execute my own handler
        if (doneView === html[0]) {
            return false;
        }
        
        // Decide which innerComponent has sent Done event
        var doneComponent = doneComponentManager.findComponentDoneByView(doneView);
        var nextComponent = doneComponentManager.findNextComponentNotDoneByComponent(doneComponent);
        if (!_.isUndefined(nextComponent)) {
            setActiveComponent(nextComponent, html);
        } else {
            // If all components had thrown previously the Done event, I'm done
            html.trigger('s2.done', html);
            return true;
        }
        return false;
    };
    
    function setActiveComponent(component, html) {
        // Send blur event to every component inside me
        html.trigger('blur');
        // Send focus event to selected component;
        component.view.trigger('focus');
    }
  
  
    // Builds the component using the given configuration in the specified
    // context.
    function buildComponent(context, config) {
        return _.extend({ component : config.constructor(context) }, config);
    };

    var firstComponentAttached=false;

    // Attaches the given component to the specified HTML using the
    // configuration.
    function attachComponent(html, config) {
        html.append(config.component.view);
        html.on(config.component.events);
        if (!firstComponentAttached) {
            config.component.view.trigger('focus');
        }
        return config.component;
    }
});

