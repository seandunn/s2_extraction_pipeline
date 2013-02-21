define(['default/default_presenter', 'labware/tubes/scripts/presenters/TubePresenter'], function (defPtr, tubePtr) {
  var workflowEngine = function () {
  };

  workflowEngine.prototype.get_next_presenter = function (owner) {
    return new tubePtr();
  };

  workflowEngine.prototype.get_default_presenter = function (owner) {
    return new defPtr(owner);
  };

  return workflowEngine;
});