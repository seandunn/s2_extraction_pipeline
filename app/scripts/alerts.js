//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define(['config',
  'text!html_partials/_alerts.html',
  'lib/pubsub'
], function (config, alertsPartialHtml, PubSub) {
  'use strict';

  var alerts = Object.create(null);

  $.extend(alerts, {

    setupPlaceholder:function (alertElement) {
      var alert = this;
      this.alertElement = alertElement;

      // Set both regular and error event handlers
      PubSub.subscribe("message.status.s2", function (event, source, eventData) {
        alert.addMessage('success', eventData.message);
      });
      PubSub.subscribe("error.status.s2", function (event, source, eventData) {
        alert.addMessage('error', eventData.message);
      });
      PubSub.subscribe("success.status.s2", function (event, source, eventData) {
        alert.addMessage('success', eventData.message);
      });
      PubSub.subscribe("info.status.s2", function (event, source, eventData) {
        alert.addMessage('info', eventData.message);
      });
    },

    appendView:function (templateData) {      
      var $element = $(_.template(alertsPartialHtml)(templateData));
      
      setTimeout(function () {
        $element.alert("close")
      }, config.messageTimeout);

      var node = this.alertElement();
      $element.appendTo(node);
      node.affix({
        offset: {
          top: 100
        }
      });
    },
    addMessage:function (messageType, message) {
      this.appendView({
        messageType:messageType,
        message:message
      });
    },

    clear:function () {
      this.alertElement().empty();
    }
  });

  return alerts;
});
