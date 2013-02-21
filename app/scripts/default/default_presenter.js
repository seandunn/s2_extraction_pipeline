define(['dummyresource', 'default/default_view'], function (rsc, view) {    // ['mapper/s2_resource'], function(S2Resource) {

  // interface ....
  var defPtr = function (owner) {
    this.owner = owner;
    this.currentView = {};
    return this;
  };

  defPtr.prototype.init = function (jquerySelection) {
    this.currentView = new view(this, jquerySelection);
    return this;
  };

  defPtr.prototype.release = function () {
    this.currentView.release();
    return this;
  };

  defPtr.prototype.update = function (data) {
    // marshall data here
    this.currentView.update(data);
    return this;
  };

  defPtr.prototype.childDone = function (childPtr, action, data) {
    // called when a child presenter wants to say something...
    return this;
  }


  defPtr.prototype.login = function () {
    var tube;
    var that = this;
    var tubePromise = new rsc('11111111-2222-3333-4444-666666666666')
        .done(function (s2tube) {
          console.log("done");
          tube = s2tube;
        })
        .fail(function () {
          console.log("fail");
        })
        .then(function () {
          console.log("tube is done : ");
          that.owner.childDone(this, "login", tube);
        });
  };


  return defPtr;
});