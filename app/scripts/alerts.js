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
      PubSub.subscribe('s2.status.message', function (event, source, eventData) {
        alert.addMessage('success', eventData.message);
      });
      PubSub.subscribe('s2.status.error', function (event, source, eventData) {
        alert.addMessage('error', eventData.message);
      });
      PubSub.subscribe('s2.status.success', function (event, source, eventData) {
        alert.addMessage('success', eventData.message);
      });
      PubSub.subscribe('s2.status.info', function (event, source, eventData) {
        alert.addMessage('info', eventData.message);
      });
    },

    appendView:function (templateData) {
      var element = $(_.template(alertsPartialHtml)(templateData));
      setTimeout(function () {
        element.detach();
      }, config.messageTimeout);

      element.appendTo(this.alertElement());
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
