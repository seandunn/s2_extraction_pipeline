define([ 'config'
  , 'workflow_engine'
  , 'mapper/s2_root'
  , 'extra_components/busy_box'
  , 'alerts'
  , 'lib/pubsub'

  , 'models/base_page_model'

  // TODO: These will move with the configuration
  , 'app-components/reception/reception'
  , 'app-components/lab-activities/lab-activities'
], function(
  config,
  nextWorkflow,
  S2Root,
  BusyBox, alerts, PubSub,
  BasePageModel,
  Reception, LabActivities
) {
  'use strict';

  var ComponentConfig = [
    { name: "reception",  selector: "#lab-management",     constructor: Reception     },
    { name: "re-racking", selector: "#lab-activities", constructor: LabActivities }
  ];

  var App = function (theControllerFactory) {
    var app = this;
    app.config = config;
    app.controllerFactory = theControllerFactory;
    _.templateSettings.variable = 'templateData';


    $('#server-url').text(config.apiUrl);
    $('#release').text(config.release);

    // Fix up the printers so that we can simply print to them!
    _.each(app.config.printers, function(printer) {
      _.extend(printer, {
        print: _.partial(_.flip(BasePageModel.printBarcodes), printer.name)
      });
    });

    // Ensure that messages are properly picked up & dispatched
    // TODO: die, eat-flaming-death!
    var html = $(".s2-page");
    _.map(["error", "success", "info"], function(type) {
      html.on(type +".status.s2", function(event, message) {
        PubSub.publish(type + ".status.s2", app, {message: message});
      });
    });

    // Change this to a filter
    var components = _.filter(ComponentConfig, function(config) {
      return html.is(config.selector);
    });

    _.map(components, function(config){

      var component = config.constructor({
        app:       app,
        printers:  app.config.printers,

        findUser: function(barcode) {
          var deferred = $.Deferred();
          var user = app.config.UserData[barcode];
          deferred[_.isUndefined(user) ? 'reject' : 'resolve'](user);
          return deferred.promise();
        },

        resetS2Root: _.bind(app.resetS2Root, app),
        getS2Root:   _.bind(app.getS2Root, app)
      });

      html
      .filter(config.selector)
      .append(component.view)
      .on(component.events);

      alerts.setupPlaceholder(function() {
        return $("#alertContainer");
      });
      app.addEventHandlers();
    });

    var $sampleExtraction = html.filter("#pipeline");
    app.jquerySelection = _.constant($sampleExtraction);
    app.addEventHandlers();
    app.setupController();

    // Handle deep-linking to pages such as lab-managment
    var url = document.location.toString();

    if (url.match('#')) {
      $('#page-nav a[href=#'+url.split('#')[1]+']').tab('show') ;
    }

    // Change hash for page-reload
    $('#page-nav a').on('shown', function (e) {
      window.location.hash = e.target.hash;
    });
  };

  App.prototype.addEventHandlers = function(){
    BusyBox.init();
  };

  App.prototype.getS2Root = function(user) {
    if ( user || (this.rootPromise === undefined) ) {
      // User should be passed in here not hard-coded
      this.rootPromise = S2Root.load({user:user});
    }
    return this.rootPromise;
  };

  App.prototype.resetS2Root = function() {
    delete this.rootPromise;
  };

  App.prototype.setupController = function (inputModel) {
    alerts.setupPlaceholder(function () {
      return $('#alertContainer');
    });
    this.updateModel(inputModel || {});

    return this;
  };

  App.prototype.updateModel = function (model) {
    var application = this;
    this.model = $.extend(this.model, model);
    $('#page-nav a[href="#pipeline"]').tab('show');

    if (this.currentPageController) {
      this.currentPageController.release();
      delete this.currentPageController;
    }

    nextWorkflow(this.model).
      then(function(workflowConfig){
      if (workflowConfig)
        {
          var roles = workflowConfig.accepts;
          _.each(roles, function(role) {
            $(document.body).addClass(role.replace(/\./g, "-"));
          });
        }
        $.extend(workflowConfig, {initialLabware: application.model.labware});
        return application.controllerFactory.create(workflowConfig && workflowConfig.controllerName, application, workflowConfig);
    }).then(function(nextController){
      application.currentPageController = nextController;
      application.currentPageController.setupController(application.model, application.jquerySelection);
      delete application.model.labware;
    });

    return this;
  };

  // "I'm a monster..."  ChildDone methods should be replaced with DOM events where possible.
  // This will probably be the last one to go.
  App.prototype.childDone = function (child, action, data) {
    console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);

    var application = this;
    config.exceptionHandling(function() {
      if (action == "done") {
        application.updateModel(data);
      } else if (action == "login") {
        application.updateModel(data);
      }
    });
    return application;
  };

  return App;
});
