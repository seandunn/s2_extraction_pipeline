//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  // Here are all of the events that behaviours can receive.
  var events = [
    'row', 'page',                  // Big scale events
    'start', 'end', 'next', 'home', // button events
    'transfer',                     // result events
    'print'                         // print events
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
  }, {
    never: basic        // Completely negative behaviour
  }).value();

  return function(name) {
    return behaviours[name];
  };
});
