define(['config', 'text!extraction_pipeline/html_partials/alerts_partial.html'], function (config, alertsPartialHtml) {
  'use strict';

  var alerts = Object.create(null);

  $.extend(alerts, {
    setupPlaceholder:function (jquerySelector) {
      var alert = this;
      this.jquerySelector = jquerySelector;

      // Set both regular and error event handlers on the body
      $('body').on('s2.status.message', function (event, message) {
        alert.addMessage('success', message);
      });
      $('body').on('s2.status.error', function (event, message) {
        alert.addMessage('error', message);
      });
    },
    appendView:function (templateData) {
      var alert = this;
      this.jquerySelector().append(_.template(alertsPartialHtml)(templateData));

      // Set the message display timeout
      window.setTimeout(function () {
        alert.jquerySelector().find('.alert').last().alert('close');
      }, config.messageTimeout);
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