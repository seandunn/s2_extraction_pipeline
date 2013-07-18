define([
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/views/step_view',
  'extraction_pipeline/lib/pubsub'
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
      this.factory = factory;

      this.config = config;
      this.config.buttons = this.config.buttons || [
        {action: "print", title: "Print labels"  },
        {action: "start", title: "Start process" },
        {action: "end",   title: "End process"   },
        {action: "next",  title: "Next"          }
      ];

      this.buttonClickedFlags = _.reduce(this.config.buttons, function (memo, button) {
        memo[button.action] = false;
        return memo;
      }, {});

      this.config.printerList = this.printerList(config);

      return this;
    },

    setupPresenter: function (model, selector) {
      var thisPresenter = this;
      this.selector = selector;
      this.batch    = model.batch;
      this.config.user = model.user;

      this.view = new View(this, this.selector);
      this.view.renderView(this.config);

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

      PubSub.subscribe("s2.step_presenter.printing_finished", printingFinishedEventHandler);
      PubSub.subscribe("s2.step_presenter.printing_started", printingStartedEventHandler);
      function printingFinishedEventHandler(event, source, eventData) {
        thisPresenter.selector().find('.component').trigger("s2.busybox.end_process");

      }
      function printingStartedEventHandler(event, source, eventData) {
        thisPresenter.selector().find('.component').trigger("s2.busybox.start_process");
      }

      this.setupSubPresenters();

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

      this.selector().find('.printer-select').val(presenter.activePresenter.config.defaultPrinter);

      presenter.activePresenter.focus();
    },

    release: function () {
      this.selector().empty().off();
      return this;
    },

    childDone: function (child, action, data) {
      var presenter = this;

      if (child === this.view) {
        // using a flag so that additional clicks
        // on a button will not be registered
        // before the button is actually disabled
        if (!presenter.buttonClickedFlags[action]){
          presenter.buttonClickedFlags[action] = true;
          // disable the button
          this.view.setButtonEnabled(action, false);
          var handler = this.activePresenter[action];
          handler && handler.apply(this.activePresenter, arguments);
          PubSub.publish("s2.step_presenter."+action+"_clicked", this);
        }
      }
      else if (action === 'done') {
        var index = _.indexOf(this.presenters, child);
        if (index !== -1) {
          var activeSubPresenter = presenter.presenters[index + 1] || {
            config:           {defaultPrinter: null},
            previousDone:     function () {
              presenter.owner.childDone.apply(presenter.owner, arguments);
            },
            initialPresenter: function () {
              // Ignore this!
            }
          };
          activeSubPresenter.previousDone(child, action, data);
          presenter.activePresenter = activeSubPresenter;
          presenter.activePresenter.initialPresenter();
          this.selector().find('.printer-select').val(presenter.activePresenter.config.defaultPrinter);
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
        thisPresenter.buttonClickedFlags[btnDetails.action+"clicked"] = !enable;
      })
    }

  });

  return Presenter;
});
