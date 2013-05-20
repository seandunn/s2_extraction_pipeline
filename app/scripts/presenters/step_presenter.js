define([
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/views/step_view'
  , 'extraction_pipeline/lib/pubsub'
], function (Base, View, PubSub) {
  'use strict';

  var Presenter = Object.create(Base);

  _.extend(Presenter, {
    register: function (callback) {
      callback('step_presenter', function () {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.factory = factory;

      this.config.buttons = this.config.buttons || [
        {action: "print", title: "Print labels"  },
        {action: "start", title: "Start process" },
        {action: "end", title: "End process"   },
        {action: "next", title: "Next"          }
      ];

      var presenter = this;
      return this;
    },

    setupPresenter: function (model, selector) {
      var thisPresenter = this;
      this.selector = selector;
      this.batch    = model.batch;
      this.user     = model.user;

      this.setupView();
      this.renderView();
      this.setupSubPresenters();

      PubSub.subscribe("s2.step_presenter.enable_buttons", enableButtonsEventHandler);
      PubSub.subscribe("s2.step_presenter.disable_buttons", disableButtonsEventHandler);
      PubSub.subscribe("s2.step_presenter.show_buttons", showButtonsEventHandler);
      PubSub.subscribe("s2.step_presenter.hide_buttons", hideButtonsEventHandler);

      function enableButtonsEventHandler(event, source, eventData) {
        thisPresenter.changeButtonsState(eventData, true);
      }
      function disableButtonsEventHandler(event, source, eventData) {
        thisPresenter.changeButtonsState(eventData, false);
      }
      function showButtonsEventHandler(event, source, eventData) {
        thisPresenter.changeButtonsVisibility(eventData, true);
      }
      function hideButtonsEventHandler(event, source, eventData) {
        thisPresenter.changeButtonsVisibility(eventData, false);
      }

      PubSub.subscribe("s2.step_presenter.next_process", nextProcessEventHandler);
      function nextProcessEventHandler(event, source, eventData) {
        // hack: reusing a bit of code defined in childDone
        thisPresenter.childDone(source,'done',eventData);
      }


      return this;
    },

    setupSubPresenters: function () {
      var presenter = this;
      presenter.presenters = _.chain(presenter.config.presenters).map(function (config, index) {
        var subPresenter = presenter.factory.create(config.presenterName, presenter, config);
        subPresenter.setupPresenter({
          batch: presenter.batch
        }, (function (i) {
          return function () {
            return presenter.selector().find('#step' + i);
          }
        })(index + 1));

        return subPresenter;
      }).value();
      presenter.activePresenter = presenter.presenters[0];
      presenter.activePresenter.initialPresenter();
      presenter.view.selectPrinter(presenter.activePresenter.config.defaultPrinter);
      presenter.activePresenter.focus();
    },

    setupSubModel: function () {
      return this;
    },

    setupView: function () {
      this.view = new View(this, this.selector);
      this.view.setPrinterList(this.printerList());
      return this;
    },

    release: function () {
      this.view.clear();
      return this;
    },

    renderView: function () {
      this.view.renderView({
        user:         this.user,
        processTitle: this.config.processTitle,
        buttons:      this.config.buttons
      });
      return this;
    },

    childDone: function (child, action, data) {
      var presenter = this;
      var btnDetailsList;

      if (child === this.view) {
        var handler = this.activePresenter[action];
        handler && handler.apply(this.activePresenter, arguments);
        PubSub.publish("s2.step_presenter."+action+"_clicked", this);
      }
      else if (action === 'done') {
        var index = _.indexOf(this.presenters, child);
        if (index !== -1) {
          var activeSubPresenter = presenter.presenters[index + 1] || {
            previousDone: function () {
              presenter.owner.childDone.apply(presenter.owner, arguments);
            }
          };
          activeSubPresenter.previousDone(child, action, data);
          presenter.activePresenter = activeSubPresenter;
          presenter.activePresenter.initialPresenter();
          presenter.view.selectPrinter(presenter.activePresenter.config.defaultPrinter);
          presenter.activePresenter.focus();
        }
      } else if (action === 'enableBtn' || action === 'disableBtn') {
        presenter.changeButtonsState(data, action === 'enableBtn');
      }
      else if (action === 'showBtn' || action === 'hideBtn') {
        presenter.changeButtonsVisibility(data, action === 'showBtn');
      }
      else {
        this.owner.childDone(child, action, data);
      }
    },

    changeButtonsVisibility: function (action, data) {
      var btnDetailsList;
      var thisPresenter = this;
      btnDetailsList = data.buttons || this.config.buttons;
      _.each(btnDetailsList, function (btnDetails) {
        thisPresenter.view.setButtonVisible(btnDetails.action, visible);
      })
    },

    changeButtonsState:function(eventData, enable){
      var thisPresenter = this;
      var btnDetailsList = eventData.buttons || this.config.buttons;
      _.each(btnDetailsList, function (btnDetails) {
        thisPresenter.view.setButtonEnabled(btnDetails.action, enable);
      })
    }

  });

  return Presenter;
});
