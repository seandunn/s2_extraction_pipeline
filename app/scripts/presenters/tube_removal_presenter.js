define(['extraction_pipeline/views/tube_removal_view'], function (TubeRemovalView) {

  var TubeRemovalPresenter = function (owner, presenterFactory) {
    this.model = undefined;
    this.owner = owner;
    this.presenterFactory = presenterFactory;
  };

  TubeRemovalPresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    /*
    * input_model = {
    *   uuid: "1234567890" // the uuid used to locate the resource
    * }
    *
    * */

    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();

    this.updateModel(input_model);
    return this;
  };

  TubeRemovalPresenter.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  TubeRemovalPresenter.prototype.setupView = function () {
    this.view = new TubeRemovalView(this, this.jquerySelection);
    return this;
  };

  TubeRemovalPresenter.prototype.updateModel = function (model) {
    this.model = model;
    this.setupSubPresenters();
    return this;
  };

  TubeRemovalPresenter.prototype.setupSubPresenters = function () {
    if (!this.tubePresenter) {

      this.tubePresenter = this.presenterFactory.createTubePresenter(this);
    }
    this.setupSubModel();
    return this;
  };

  TubeRemovalPresenter.prototype.setupSubModel = function () {
    if (this.model) {
      var that = this;
//      debugger;
      var data = {
        uuid:this.model.uuid
      };

      this.tubePresenter.setupPresenter(data,function () {
        return that.jquerySelection().find("div.placeholder");
      });
      console.log(">>>>> ",this.tubePresenter);

    }
      // equivalent to the call to tubePresenter.setupPresenter()
//      this.tubePresenter.setupView(function () {
//        console.log(that.jquerySelection());
//        return that.jquerySelection().find("div.placeholder");
//      });

  };

  TubeRemovalPresenter.prototype.renderView = function () {
    console.log("### renderView", this.model);

    if (this.view) {
      this.view.render(this.model);
    }
    if (this.tubePresenter) {
      this.tubePresenter.renderView();
    }

  };

  TubeRemovalPresenter.prototype.release = function () {
    if (this.view) {
      this.view.clear();
    }
  };

  /*
  TODO : update data schema
  action : "removeTube" -> data == { ?? }
   */
  TubeRemovalPresenter.prototype.childDone = function (child, action, data) {
    if (child === this.view){
      if (action == "removeTube"){
//        var action = action;
//        var data = data;
        this.owner.childDone(this, action, data);
      }
    }
  };

  return TubeRemovalPresenter;

});
