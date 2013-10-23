define([
  'text!app-components/linear-process/_component.html',

  // Globally included stuff added after this comment
  , 'lib/jquery_extensions'
], function (componentView) {
  'use strict';

  var componentContainer = _.compose($, _.template(componentView));

  return function(externalContext) {
    var context = _.extend({
      dynamic: _.ignore
    }, externalContext);

    var html = componentContainer(context);

    // Build and attach any components that are present in the context.  This handles the
    // non-dynamic situations.
    var components = _.map(context.components, _.partial(buildComponent, context));
    _.each(components, _.partial(attachComponent, html));

    // Dynamic components deal with attaching components by registering a callback.
    context.dynamic(function(component) {
      components.push(component);
      attachComponent(html, component);
      html.trigger("deactivate.s2");
    });

    return {
      view: html,
      events: $.stopsPropagation({
        "activate.s2":   $.ignoresEvent(_.partial(initialiseProcessChain, html, components)),
        "deactivate.s2": _.partial(deactivate, html),
        "focus":         function() { components[0].view.focus(); }
      })
    };
  };

  function deactivate(html, event) {
    if (html[0] !== event.target) html.trigger("deactivate.s2");
  }

  function initialiseProcessChain(html, components) {
    // Build all of the information about transitions: the transition to be made, how to execute
    // it, and how to skip it.  Then tie the transition of one component, to the execution of
    // the next, thus building a chain that can be used for handling the "done.s2" event.
    var transitions = _.map(
      _.zip(components, _.drop(components, 1)),
      _.partial(buildTransition, html)
    );

    var callChain =
      _.chain(transitions)
       .zip(_.drop(transitions, 1))
       .reduceRight(function(m, p) {
         var current = p[0], next = p[1] || {execute:_.constant(undefined)};   // EOL is empty!
         current.transition = _.partial(current.transition, next.execute);
         current.execute    = _.partial(current.execute, current.transition);
         current.skip       = _.partial(current.skip, current.transition);
         m.unshift(current);
         return m;
       }, [])
       .value();

    // The first transition in the chain is what will be executed on the first "done.s2".
    // Subsequent "done.s2" events will replace this with the next transition.
    html.on("done.s2", createDoneHandler(html, callChain[0].transition));

    // To handle skipping all we have to do is be able to identify which component wants skipping
    // and then enact it's skip handler.
    var componentsToSkip = 
      _.chain(components)
       .zip(_.pluck(transitions, "skip"))
       .map(function(pair) { return {view:pair[0].view[0], skip:pair[1]}; })
       .value();

    html.on("skip.s2", stopsEvent(function(view) {
      var details = _.find(componentsToSkip, function(details) {
        return details.view === view;
      });
      details.skip();
    }));

    setActiveComponent(components[0], html);
  }

  function buildTransition(html, pair) {
    // Determine the from and to transitions
    var from = function() { pair[0].view.trigger("deactivate.s2"); };
    var to   = function() { html.trigger("done.s2", html); }
    if (!_.isUndefined(pair[1])) to = function() { pair[1].view.trigger("activate.s2").focus(); };

    // By default we want our transition to be the next in the sequence.
    var us = _.identity;

    return {
      transition: transition,
      execute:    execute,
      skip:       skip
    };

    // Transition is ease: perform the from, perform the to, then perform the execution of the next
    // component.
    function transition(execute) {
      from();
      to();
      return execute();
    }

    // This is called by the transition above as 'next'.  It'll either return our transition function,
    // or will execute our transition function, which will return the next components transition!
    function execute(transition) {
      return us(transition);
    }

    // Skipping ourselves is simple: call our transition!  We have to rely on the transition here
    // being our transition!
    function skip(transition) {
      us = function() {
        return transition();
      };
    }
  }

  function createDoneHandler(html, doneHandler) {
    return function(event, doneView) {
      if (html[0] === doneView) return true;
      doneHandler = doneHandler(event, doneView);
      return false;
    };
  }
  function stopsEvent(f) {
    return $.stopsPropagation($.ignoresEvent(f));
  }

  function setActiveComponent(component, html) {
    // Send blur event to every component inside me
    html.trigger('s2.deactivate');
    // Send focus event to selected component;
    component.view.trigger('s2.activate').focus();
  }


  // Builds the component using the given configuration in the specified
  // context.
  function buildComponent(context, config) {
    return config.constructor(_.extend(context, config.context || {}));
  }

  // Attaches the given component to the specified HTML using the
  // configuration.
  function attachComponent(html, component) {
    html.append(component.view).on(_.omit(component.events, ["focus","activate.s2"]));
    component.view.on(_.pick(component.events, ["focus","activate.s2"]));
    return component;
  }
});

