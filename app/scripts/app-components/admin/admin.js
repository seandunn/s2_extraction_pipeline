define([
  "app-components/process-choice/process-choice",
  "app-components/admin/statusMgmt"], function(ProcessChoice, StatusMgmt) {
  "use strict";

  return function(context) {
    return new ProcessChoice(_.extend({
      components: [
        {label: "Status", id: "status", constructor: StatusMgmt}
      ]
    }, context));
  };
});
