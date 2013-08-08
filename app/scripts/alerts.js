define(['config',
  'text!html_partials/alerts_partial.html',
  'lib/pubsub'
], function (config, alertsPartialHtml, PubSub) {
  'use strict';

  var alerts = Object.create(null);

  $.extend(alerts, {

    setupPlaceholder:function (jquerySelector) {
      var alert = this;
      this.jquerySelector = jquerySelector;

      // Set both regular and error event handlers
      PubSub.subscribe('s2.status.message', function (event, source, eventData) {
        alert.addMessage('success', eventData.message);
      });
      PubSub.subscribe('s2.status.error', function (event, source, eventData) {
        alert.addMessage('error', eventData.message);
      });
    },

    appendView:function (templateData) {
      var element = $(_.template(alertsPartialHtml)(templateData));
      setTimeout(function () {
        element.alert('close');
      }, config.messageTimeout);

      element.appendTo(this.jquerySelector());
    },

    addMessage:function (messageType, message) {
      this.appendView({
        messageType:messageType,
        message:message
      });
    },

    clear:function () {
      this.jquerySelector().empty();
    }
  });

  return alerts;
});