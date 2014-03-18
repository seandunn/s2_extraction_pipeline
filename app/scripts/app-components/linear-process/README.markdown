# Linear Process
A component that is, itself, a linear sequence of several components.  Only one of
these sub-components is active at a time, and each component signals when it is
completed to indicate that the next component should become active.

Components can be built at creation time, or dynamically added by this component
registering a callback through the `dynamic` entry in the context passed.

The context should contain one, or more, of:

* `components` which is a list of components to build, each is an object:
  * `constructor` is the component constructor function.
* `dynamic` which is a function that enables dynamic component addition.

It generates the following events:
* `done.s2` after all sub-components have completed;
* `focus` focuses on the first component.

It responds to the following events:
* `done.s2` from a sub-component that has been completed;
* `skip.s2` from a sub-component that wants to be skipped over.

It expects the sub-components to respond to the following events:
* `activate.s2` when the component is made active;
* `deactivate.s2` when the component is made inactive.

# Switchable Linear Process

A wrapper over LinearProcess that adds the functionality of toggling CSS 
class on components for tagging the diferent status of the component inside the 
linear process. The context could contain any of these parameters:

* `focusClass` CSS class that will representa that a component receives focus event.
* `blurClass` CSS class for a component receiving blur event
* `skipClass` CSS class that will be added whenever a component inside the linear 
process is skipped (see `skip.s2` event of LinearProcess).