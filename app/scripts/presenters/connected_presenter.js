define([
      'extraction_pipeline/presenters/base_presenter',
       'extraction_pipeline/models/connected',
       'text!extraction_pipeline/html_partials/connected_partial.html'
], function(BasePresenter, Model, Template) {
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
      this.model.setBatch(input_model.batch);
      this.renderView();
      this.setupSubPresenters();
      return this;
    },
    setupSubPresenters: function(reset) {
      this.model.setupInputPresenters(reset);
      return this;
    },

    focus: function() {
      var presenter = _.find(this.rowPresenters, function (presenter) {
        return !presenter.isRowComplete();
      });

      // There will not be an incomplete row returned if the entire page is complete. Therefore nothing to focus on.
      if (presenter) {
        presenter.focus();
      }
    },

    release:function () {
      this.currentView.clear();
      return this;
    },
    renderView:function () {
      var dataForView = null;

      if (this.model && this.model.config) {
        dataForView = {
          batch:this.model.batch && this.model.batch.uuid,
          user:this.model.user,
          processTitle:this.model.config.processTitle
        }
        this.focus();
      }

      this.jquerySelection().html(this.template());

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
      if (action === 'inputBarcodeScanned') {
        var originator = data.origin, presenter = this;
        presenter.model.inputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          presenter.model.inputs.pull(resource);
        }).done(function() {
          presenter.focus();
        });
      } else if (action === 'outputBarcodeScanned') {
        var originator = data.origin, presenter = this;
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
        var model = this.model;
        model.operate('row', [child]);

        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"start"}]});
        }
      }
    },

    modelDone: function(child, action, data) {

      if (action === 'outputsReady') {

        this.model.ready = true;
        this.setupSubPresenters(true);
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

      } else if (action === "barcodePrintSuccess") {

        $('body').trigger('s2.status.message', 'Barcode labels printed');
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"print"}]});

      } else if (action === "barcodePrintFailure") {

        $('body').trigger('s2.status.error', 'Barcode labels could not be printed');
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

      } else if (action === "startOperation") {

        this.model.started = true;
        $('body').trigger('s2.status.message', 'Transfer started');
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"end"}]});

      } else if (action === "completeOperation") {

        $('body').trigger('s2.status.message', 'Transfer completed');
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"next"}]});
        }

        var that = this;
        this.model.behaviours.done.transfer(function() {
          that.owner.childDone(that, "done", { batch:that.model.batch });
        });

      } else if (action === "successfulOperation") {

        _.each(data, function(presenter){
          presenter.lockRow();
        });

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
