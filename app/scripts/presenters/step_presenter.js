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

      var presenter = this;
      this.fallback = {
        model: {
          previousDone:function() {
            presenter.owner.childDone.apply(presenter.owner, arguments);
          }
        }
      };
      return this;
    },

    setupPresenter: function(model, selector) {
      this.selector = selector;
      this.batch    = model.batch;

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
      presenter.activePresenter.focus();
    },
    setupSubModel: function() {
      return this;
    },

    setupView: function() {
      this.view = new View(this, this.selector);
      return this;
    },
    release: function() {
      this.view.clear();
      return this;
    },
    renderView: function() {
      this.view.renderView({
        user: undefined,
        processTitle: this.config.processTitle
      });
      return this;
    },

    childDone: function(child, action, data) {
      if (child === this.view) {
        var handler = this.activePresenter[action];
        handler && handler.apply(this.activePresenter, arguments);
      } else if (action === 'done') {
        var index = _.indexOf(this.presenters, child);
        if (index !== -1) {
          var presenter = this;
          var active = presenter.presenters[index+1] || presenter.fallback;
          active.model.previousDone(child, action, data);
          presenter.activePresenter = active;
        }
      }
    }
  });

  return Presenter;
});
