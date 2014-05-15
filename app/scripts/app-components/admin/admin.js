define([
  "app-components/process-choice/process-choice",
  "app-components/admin/statusMgmt",
  "app-components/admin/createKit",
  "app-components/admin/addRole"
  ], function(ProcessChoice, StatusMgmt, CreateKit, AddRole) {
  "use strict";

  return function(context) {
    return new ProcessChoice(_.extend({
      components: [
        {label: "Status", id: "status", constructor: StatusMgmt},
        {label: "Create Kit", id: "createKit", constructor: CreateKit},
        {label: "Add role", id: "addRole", constructor: AddRole}
      ]
    }, context));
  };
});
