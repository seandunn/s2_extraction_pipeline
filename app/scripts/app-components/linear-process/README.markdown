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
* `s2.done` after all sub-components have completed;
* `focus` focuses on the first component.

It responds to the following events:
* `s2.done` from a sub-component that has been completed;
* `s2.skip` from a sub-component that wants to be skipped over.

It expects the sub-components to respond to the following events:
* `s2.activate` when the component is made active;
* `s2.deactivate` when the component is made inactive.
