define([
  "config",
  "workflow_engine",
  "mapper/s2_root",
  "extra_components/busy_box",
  "alerts",
  "lib/pubsub",
  "models/base_page_model",
  "app-components/labelling/scanning",

  // TODO: These will move with the configuration
  "app-components/lab-management/lab-management",
  "app-components/lab-activities/lab-activities",
  "jquery_cookie",

  // Globally included stuff added after this comment
  "lib/jquery_extensions"
], function(
  config,
  nextWorkflow,
  S2Root,
  BusyBox, alerts, PubSub,
  BasePageModel,
  barcodeScanner,
  LabMangement, LabActivities,
  Cookie
) {
  'use strict';

  var ComponentConfig = [
    { name: "Lab Management",  selector: "#lab-management", constructor: LabMangement     },
    { name: "Lab Activities", selector: "#lab-activities", constructor: LabActivities }
  ];


  var App = function (theControllerFactory) {
    var app = this;
    window.app = this;
    app.config = config;
    app.config.userPromise = new $.Deferred();
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
    _.each(["error", "success", "info"], function(type) {
      $("#page-content").on(type +".status.s2", function(event, message) {
        PubSub.publish(type + ".status.s2", app, {message: message});
      });
    });

    _.each(ComponentConfig, function(config){
      var component = createComponent(config);

      $(config.selector)
      .append($('<h2>').text(config.name))
      .append(component.view)
      .on(component.events);

    });

    app.jquerySelection = _.constant($("#pipeline"));
    app.addEventHandlers();
    app.setupController();

    // Handle deep-linking to pages such as lab-management
    var url = document.location.toString();

    // Change location hash to match the clicked nav tab
    $('#page-nav').on('shown','a', function (e) {
      window.location.hash = e.target.hash;
      alerts.clear();
    });

    //// New login stuff...
    var $loggingPage = $("#logging-page");

    var error   = function(message) { $loggingPage.trigger("error.status.s2", message); };

    // The user needs to scan themselves in before doing anything
    var userComponent = barcodeScanner({
      label: "User",
      icon: "icon-user"
    });

    $loggingPage.append(userComponent.view);
    $loggingPage.on(userComponent.events);
    $loggingPage.on("scanned.barcode.s2", connect);

    $loggingPage.on("error.barcode.s2", $.ignoresEvent(error));

    // Hides the outgoing component and shows the incoming one.
    function showPage(user) {
      $('#page-nav').on('click', 'a', function (e) {
        e.preventDefault();
        $(this).tab('show');
      });

      $('#user-email')
      .addClass('in')
      .find('.email')
      .text(user.email);

      var pipelineElements = _.map(
        user.pages,
        function filterPipelines(pipeline){
          return "a[href=#"+pipeline+"]";
      })
      .join(", ");

      $('#page-nav li a')
      .not(pipelineElements)
      .parent()
      .remove();

      $('#logging-bar').addClass('in');

      var pageRef = url.match(/#.*$/);
      if (pageRef && pageRef[0] !== "#logging-page") {
        $('#page-nav a[href='+pageRef[0]+']').tab('show') ;
      } else {
        $('#page-nav a[href="#pipeline"]').tab('show');
      }
    }


    // Deals with connecting the user with the specified barcode to the system.
    function connect(e, userBarcode) {
      e.stopPropagation();

      return findUser(userBarcode)
      .then(
        showPage,
        _.partial(error, "User barcode is unrecognised")
      );
    }

    function findUser(barcode, accessList) {
      var deferred = $.Deferred();
      var user = app.config.UserData[barcode];

      if (user === undefined) {
        return deferred.reject().promise();
      } else {
        user.pages = (user.pages || []).concat(app.config.defaultPages);
        app.config.login = user.email;
        app.config.userPromise.then(function() {
          app.config.rootPromise = app.getS2Root(user);
        });
        app.config.userPromise.resolve(user.email);        
        app.config.disablePrinting = ($.cookie("disablePrinting") === "true");
        return deferred.resolve(user).promise();
      }
    }

    //     /////
    function buildUserDefer(app) {
      var defer = new $.Deferred();
      defer.resolve(userDefer);
      return defer;
    }

    function createComponent(config){
      return config.constructor({
        app:       app,
        printers:  app.config.printers,
        resetS2Root: _.bind(app.resetS2Root, app),
        getS2Root:   _.bind(app.getS2Root, app),
      });
    }
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

  function resetTagRolesInBody() {
    var classNames = document.body.className.split(" ");
    // Removes previous classes from body
    _.each(_.filter(classNames, function(className) { 
      return className.match(/^ROLE\-/)
    }), function(role) {
      $(document.body).removeClass(role);
    });    
  }
  
  function tagRoleInBody(role) {
    // Add new class
    $(document.body).addClass("ROLE-"+role.replace(/\./g, "-"));
  }
  
  App.prototype.updateModel = function (model) {
    var application = this;
    this.model = $.extend(this.model, model);

    if (this.currentPageController) {
      this.currentPageController.release();
      delete this.currentPageController;
    }

    nextWorkflow(this.model).
      then(function(workflowConfig){
      if (workflowConfig)
        {
          var roles = workflowConfig.accepts;
          if (!_.isArray(roles)) {
            roles = [roles];
          }
          resetTagRolesInBody();
          _.each(roles, tagRoleInBody);
        }
        $.extend(workflowConfig, {initialLabware: application.model.labware});
        var controller =  application.controllerFactory.create(workflowConfig && workflowConfig.controllerName, application, workflowConfig);
        controller.on("controllerDone", function(data) {
          application.updateModel(data);
        });
        return controller;
    }).then(function(nextController){
      application.currentPageController = nextController;
      application.currentPageController.setupController(application.model, application.jquerySelection);
      delete application.model.labware;
    }).fail(_.bind(function(msg) {
      if (!_.isUndefined(model.scanNewIfNotFound)) {
        this.showLabwareScanningPage();
      } else {
        PubSub.publish("error.status.s2", app, {message: msg});
        $("input").attr("disabled", false).focus();
      }
    }, this));

    return this;
  };
  
  App.prototype.showLabwareScanningPage = function() {
    this.controllerFactory.create(null, this, null)
      .setupController(this.model, this.jquerySelection);    
  };
  

  // "I'm a monster..."  ChildDone methods should be replaced with DOM events where possible.
  // This will probably be the last one to go.
  App.prototype.childDone = function (child, action, data) {
    /* throw("Deprecated. Use application.updateModel instead.\n So controller.owner.childDone(foo, action, data) becomes controller.owner.updateModel(data).") */
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
