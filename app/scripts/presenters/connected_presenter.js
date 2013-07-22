define([
      'extraction_pipeline/presenters/base_presenter',
       'extraction_pipeline/models/connected',
       'text!extraction_pipeline/html_partials/connected_partial.html',
       'extraction_pipeline/lib/pubsub'
], function(BasePresenter, Model, Template, PubSub) {
  'use strict';

  var Presenter = Object.create(BasePresenter);

  $.extend(Presenter, {
    register:function (callback) {
      callback('connected_presenter', function (owner, factory, initData) {
        return Object.create(Presenter).init(owner, factory, initData);
      });
    },

    init:function (owner, presenterFactory, initData) {
      this.config           = initData;
      this.owner            = owner;
      this.model            = Object.create(Model).init(this, initData);
      this.rowPresenters    = [];
      this.presenterFactory = presenterFactory;
      this.template         = _.template(Template);
      return this;
    },

    setupPresenter:function (input_model, jquerySelection) {
      this.jquerySelection = jquerySelection;
      // send busy message
      var thisPresenter = this;
      thisPresenter.jquerySelection().trigger("s2.busybox.start_process");
      this.model.setBatch(input_model.batch)
          .then(function(){
            thisPresenter.jquerySelection().trigger("s2.busybox.end_process");
          }).fail(function(error){
            PubSub.publish('s2.status.error', thisPresenter, error);
            thisPresenter.jquerySelection().trigger("s2.busybox.end_process");
          }).then(function(){
            thisPresenter.jquerySelection().html(thisPresenter.template({nbRow:12}));
            thisPresenter.setupSubPresenters();
          });
      return this;
    },

    setupSubPresenters: function(reset) {
      var thisPresenter = this;
      this.model.setupInputPresenters(reset)
          .then(function(){
            var currentPresenter = _.find(thisPresenter.rowPresenters, function (presenter) {
              return !presenter.isRowComplete();
            });
            // There will not be an incomplete row returned if the entire page is complete. Therefore nothing to focus on.
            if (currentPresenter) {
              currentPresenter.focus();
              // we lock the other rows...
              _.chain(thisPresenter.rowPresenters).reject(function(rowPresenter){
                return rowPresenter === currentPresenter;
              }).each(function(presenter){
                presenter.lockRow();
              });
              currentPresenter.unlockRow();
            }
            if(thisPresenter.model.started){
              thisPresenter.owner.childDone(this, "disableBtn", {buttons:[{action:"print"}]});
              thisPresenter.owner.childDone(this, "enableBtn", {buttons:[{action:"end"}]});
            }
          });
      return this;
    },

    focus: function() {
    },

    release:function () {
      this.currentView.clear();
      return this;
    },

    checkPageComplete:function () {
      return _.all(this.rowPresenters, function (presenter) {
        return presenter.isRowComplete();
      });
    },

    childDone:function (child, action, data) {
      if (child === this.currentView) {
        this.currentViewDone(child, action, data);
      } else if (child === this.model) {
        this.modelDone(child, action, data);
      } else {
        this.unknownDone(child, action, data);
      }
    },

    unknownDone:function (child, action, data) {
      var originator = data.origin, presenter = this;
      if (action === 'inputBarcodeScanned') {
        presenter.model.inputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          presenter.model.inputs.pull(resource);
        }).done(function() {
          presenter.focus();
        });
      } else if (action === 'outputBarcodeScanned') {
        presenter.model.outputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          presenter.model.outputs.pull(resource);
        }).done(function() {
          presenter.focus();
        });
      } else if (action === 'inputRemoved') {
        this.model.inputs.push(data.resource);
        presenter.owner.childDone(presenter, "disableBtn", {buttons:[{action:"start"}]});
      } else if (action === 'outputRemoved') {
        this.model.outputs.push(data.resource);
        presenter.owner.childDone(presenter, "disableBtn", {buttons:[{action:"start"}]});
      } else if (action === 'completed') {
        this.rowDone(child, action, data);
      }
    },

    rowDone: function(child, action, data) {
      if (action === 'completed') {
        this.model.operate('row', [child]);
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"start"}]});
        }
      }
    },

    modelDone: function(child, action, data) {

      if (action === 'outputsReady') {

        this.model.ready = true;
        this.setupSubPresenters(true);
        PubSub.publish('s2.step_presenter.printing_finished', this);

      } else if (action === "barcodePrintSuccess") {

        PubSub.publish('s2.status.message', this, {message: 'Barcode labels printed'});
        PubSub.publish('s2.step_presenter.printing_finished', this);
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"print"}]});

      } else if (action === "barcodePrintFailure") {

        PubSub.publish('s2.status.error', this, {message: 'Barcode labels could not be printed'});
        PubSub.publish('s2.step_presenter.printing_finished', this);
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

      } else if (action === "startOperation") {

        this.model.started = true;
        PubSub.publish('s2.status.message', this, {message: 'Transfer started'});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"end"}]});

      } else if (action === "completeOperation") {

        PubSub.publish('s2.status.message', this, {message: 'Transfer completed'});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"next"}]});
        }

        var that = this;
        this.model.behaviours.done.transfer(function() {
          that.owner.childDone(that, "done", { batch:that.model.batch });
        });

      } else if (action === "successfulOperation") {
        // locks the rowPresenters which have successfully completed their operations
        _.each(data, function(presenter){
          presenter.lockRow();
        });

        // find the index of the last rowPresenter which has successfully completed its operations
        var lastIndex = -1;
        _.each(this.rowPresenters,function(rowPresenter, index){
          if (_.contains(data,rowPresenter)){
            lastIndex = lastIndex < index ? index : lastIndex;
          }
        });
        // if there is at least one presenter after...
        if (lastIndex+1 < this.rowPresenters.length){
          // we unlock it
          this.rowPresenters[lastIndex+1].unlockRow();
        }
      }
    },

    readyToCreateOutputs: function() {
      return !this.model.started;
    },

    currentViewDone: function(child, action, data) {
    },

    initialPresenter: function() {
      this.model.previous = true;
      this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});
    },

    previousDone: function(child, action, data) {
      this.model.previous = true;
    },

    print: function(child, action, data) {
      if (this.readyToCreateOutputs()) {
        PubSub.publish('s2.step_presenter.printing_started', this);
        this.model.createOutputs(data);
      }
    },

    next:  function(child, action, data){
      var presenter = this;

      this.model.behaviours.done[action](
        function(){ presenter.owner.childDone(presenter, 'done') },
        function(){ eventHandler.call(presenter, child, action, data); }
      )
    },

    start: eventHandler,

    end:   eventHandler
  });
  return Presenter;

  function eventHandler(child, action, data) {
    if (this.checkPageComplete()) {
      var that = this;
      that.model.operate(action, that.rowPresenters);
      that.model.behaviours.done[action](function() {
        that.owner.childDone(that, "done", {
          batch: that.model.batch,
          user: that.model.user
        });
      });
    }
  }
});
