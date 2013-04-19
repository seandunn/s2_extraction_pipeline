define([], function() {
  // Here are all of the events that behaviours can receive.
  var events = [
    'row', 'page',              // Big scale events
    'start', 'end', 'next',     // button events
    'transfer'                  // result events
  ];

  // There is a standard basic behaviour that is completely negative.  It is built
  // from all of the events that can happen.
  var basic = _.chain(events).reduce(function(memo, name) {
    memo[name] = function(p, n) { n && n(); };
    return memo;
  }, {}).value();

  // Then we have the positive cases for each of the events on top of the basic
  // behaviour.  This means that we can say things happen on 'row'.
  var behaviours = _.chain(events).reduce(function(memo, name) {
    memo[name] = $.extend({}, basic);
    memo[name][name] = function(p, n) { p && p(); };
    return memo;
  }, {}).value();

  return function(name) {
    return behaviours[name];
  };
});
