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

      $element.appendTo(this.alertElement());
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
