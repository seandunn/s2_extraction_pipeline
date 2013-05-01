define(['text!extraction_pipeline/html_partials/alerts_partial.html'], function (alertsPartialHtml) {
  'use strict';

  var alerts = Object.create(null);

  $.extend(alerts, {
    setupPlaceholder:function (jquerySelector) {
      var alert = this;
      this.jquerySelector = jquerySelector;

      // Set both regular and error event handlers on the body
      $('body').on('s2.status.message', function (event, message) {
        alert.addMessage(message);
      });
      $('body').on('s2.status.error', function (event, message) {
        alert.addError(message);
      });
    },
    appendView:function (templateData) {

      this.jquerySelector().append(_.template(alertsPartialHtml)(templateData));
    },
    addMessage:function (message) {
      // set the user and indices as template data
      var templateData = {
        messageType:'success',
        message:message
      };

      this.appendView(templateData);
    },
    addError:function (message) {
      // set the user and indices as template data
      var templateData = {
        messageType:'error',
        message:message
      };

      this.appendView(templateData);
    },
    clear:function () {
      this.jquerySelector().empty();
    }
  });

  return alerts;
});