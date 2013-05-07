define([
       'extraction_pipeline/presenters/base_presenter',
       'extraction_pipeline/views/step_view'
], function(Base, View) {
  'use strict';

  var Presenter = Object.create(Base);

  _.extend(Presenter, {
    register: function(callback) {
      callback('step_presenter', function() {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function(owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.factory = factory;

      this.config.buttons = this.config.buttons || [
        {action:"print", title:"Print labels"  },
        {action:"start", title:"Start process" },
        {action:"end",   title:"End process"   },
        {action:"next",  title:"Next"          }
      ];

      var presenter = this;
      return this;
    },

    setupPresenter: function(model, selector) {
      var presenter = this;
      this.selector = selector;
      this.batch    = model.batch;
      this.user     = model.userUUID;

      this.setupView();
      this.renderView();
      this.setupSubPresenters();
      return this;
    },
    setupSubPresenters: function() {
      var presenter = this;
      presenter.presenters = _.chain(presenter.config.presenters).map(function(config, index) {
        var subPresenter = presenter.factory.create(config.presenterName, presenter, config);
        subPresenter.setupPresenter({
          batch: presenter.batch
        }, (function(i) {
          return function() { return presenter.selector().find('#step'+i); }
        })(index+1));

        return subPresenter;
      }).value();
      presenter.activePresenter = presenter.presenters[0];
      presenter.activePresenter.initialPresenter();
      presenter.view.selectPrinter(presenter.activePresenter.config.defaultPrinter);
      presenter.activePresenter.focus();
    },
    setupSubModel: function() {
      return this;
    },

    setupView: function() {
      this.view = new View(this, this.selector);
      this.view.setPrinterList(this.printerList());
      return this;
    },
    release: function() {
      this.view.clear();
      return this;
    },
    renderView: function() {

      this.view.renderView({
        user: this.user,
        processTitle: this.config.processTitle,
        buttons:this.config.buttons
      });
      return this;
    },

    childDone: function(child, action, data) {
      var presenter = this;
      var btnDetailsList;

      if (child === this.view)
      {
        var handler = this.activePresenter[action];
        handler && handler.apply(this.activePresenter, arguments);
      }
      else if (action === 'done')
      {
        var index = _.indexOf(this.presenters, child);
        if (index !== -1) {
          var activeSubPresenter = presenter.presenters[index+1] || {
            previousDone:function() {
              presenter.owner.childDone.apply(presenter.owner, arguments);
            }
          };
          activeSubPresenter.previousDone(child, action, data);
          presenter.activePresenter = activeSubPresenter;
          presenter.activePresenter.initialPresenter();
          presenter.view.selectPrinter(presenter.activePresenter.config.defaultPrinter);
          presenter.activePresenter.focus();
        }
      }
      else if (action === 'enableBtn' || action === 'disableBtn')
      {
        btnDetailsList = data.actions || this.config.buttons;
        _.each(btnDetailsList, function(btnDetails){
          presenter.view.setButtonEnabled(btnDetails.action, action === 'enableBtn');
        })
      }
      else if (action === 'showBtn' || action === 'hideBtn')
      {
        presenter.changeButonsVisibility(action,data);
      }
      else
      {
        this.owner.childDone(child, action, data);
      }
    },

    changeButonsVisibility:function(action, data){
      var btnDetailsList;
      var presenter = this;
      btnDetailsList = data.actions || this.config.buttons;
      _.each(btnDetailsList, function(btnDetails){
        presenter.view.setButtonVisible(btnDetails.action, action === 'showBtn');
      })
    },

    changeButonsStatus:function(action, data){
      var btnDetailsList;
      var presenter = this;
      btnDetailsList = data.actions || this.config.buttons;
      _.each(btnDetailsList, function(btnDetails){
        presenter.view.setButtonVisible(btnDetails.action, action === 'showBtn');
      })
    }

  });

  return Presenter;
});
