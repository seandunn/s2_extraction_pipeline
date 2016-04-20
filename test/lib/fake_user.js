//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "jquery"
], function () {
  "use strict";

  // Allows the tests to wait for UI element to appear.
  if ($.fn.fakeUser) return; // make sure it is only added once

  $.fn.fakeUser = function (selector, successCallBack, failureCallBack) {
    var $this = this;
    var thisSelector = this.find(selector);

    if (thisSelector.length) {
      resetDelay(this.selector);
      successCallBack();
    } else {
      var delay = 500;
      var timeOut = 1500;
      var newDelay = getNewDelay(this.selector, delay);
      if (newDelay < timeOut) {
        window.setTimeout(function () {
          $this.fakeUser(selector, successCallBack, failureCallBack);
        }, delay);
      } else {
        resetDelay(this.selector);
        failureCallBack();
      }
    }
    return thisSelector;

    function getNewDelay(selector, delay) {
      window.WUIE_delays = window.WUIE_delays || {};
      window.WUIE_delays[selector] = ( window.WUIE_delays[selector] || 0 ) + delay;
      return window.WUIE_delays[selector];
    }

    function resetDelay(selector) {
      window.WUIE_delays = window.WUIE_delays || {};
      if (window.WUIE_delays[selector]) {
        delete  window.WUIE_delays[selector];
      }
    }
  };

  return {
    waitsForIt: function (context, element, successCallback, errorCallback) {
      var actionDone = $.Deferred();
      $(context)
          .fakeUser(element, function () {
            successCallback();
            setTimeout(actionDone.resolve, 100);
          }, function () {
            errorCallback && errorCallback();
            actionDone.reject();
          });
      return actionDone;
    },

    aPressReturnEvent: function () {
      return jQuery.Event("keyup", {which: 13});
    }
  };
});

