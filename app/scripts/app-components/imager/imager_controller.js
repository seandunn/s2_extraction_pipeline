define([ "config", "app-components/imager/imager", "models/selection_page_model" , "lib/pubsub", "mapper/operations", "text!app-components/imager/header.html", "app-components/imager/connect"
], function(appConfig, imager, Model, PubSub, Operations, template, connect) {
  "use strict";
  return (
    { register : function(callback) {
      return callback("imager", imagerController);
    }
    });
  
  function configButtons(status) {
    var buttons = $("button.imager");
    var inputs = $("input.imager");
    var renderButtons = {
      "in_progress": function() {
        buttons.prop("disabled", true);
        inputs.prop("disabled", true);
        $(buttons[1]).prop("disabled", false);
      },
      "done": function() {
        buttons.prop("disabled", false);
        inputs.prop("disabled", false);
        $(buttons[0]).prop("disabled", true);
        $(buttons[1]).prop("disabled", true);
      },
      "default": function() {
        buttons.prop("disabled", true);
        inputs.prop("disabled", true);
        $(buttons[0]).prop("disabled", false);
        $(buttons[1]).prop("disabled", false);
      }
    };
    var methodDefault = renderButtons["default"];
    var method = (status && renderButtons[status]) || methodDefault;
    return method();
  }
  
  function imagerController(owner, factory, config) {
    var uuid = config.initialLabware.uuid;

    return { 
      notBatched: true,
      getS2Root: _.constant(owner.rootPromise),
      beginImager: function() {
        var model = this.model;
        model.started = true;          
        PubSub.publish("message.status.s2", this, {message: 'Transfer started'});
        config.initialLabware.order().then(function(orderObj) {
          return {
            input: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.input.role
            },
            output: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.output[0].role                 
            }
          };
       }).then(function(data) {
         Operations.stateManagement().start({ updates: [data]});
       });          
      },
      endImager: function() {
        var model = this.model;
        PubSub.publish("message.status.s2", this, {message: 'Transfer completed'});
        config.initialLabware.order().then(function(orderObj) {
          return {
            input: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.input.role
            },
            output: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.output[0].role                 
            }
          };
       }).then(function(data) {
         return Operations.stateManagement().complete({ updates: [data]});
       });          
      },
      selectFile: function(data) {
        var file = this.dataParams.gel_image;
        // Encoding from: 
        // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding>
        file.filename=data.name;
        file.image = data.content.substring(data.content.indexOf(",")+1);
        //file.image = window.btoa(unescape(encodeURIComponent(data.content)));
        //file.filename=data.
        //file.image = window.btoa("testing");
        
        //configButtons("done");            
      },
      upload: function() {
        var dataParams = this.dataParams, 
            model = this.model;
        // This must be moved to S2 Mapper
        var url = appConfig.apiUrl + "lims-quality";
        dataParams.gel_image.gel_uuid = uuid;
        var promiseQuery = $.ajax(url+"/gel_images",
          {
            headers :
            {
              Accept : "application/json; charset=utf-8",
              "Content-Type" : "application/json; charset=utf-8"
            }, 
            data : JSON.stringify(dataParams),
            method : "POST"
          }).then(_.bind(function() {
            this.view.trigger("success.status.s2",['Uploaded file']);
          }, this), _.bind(function() {
            this.view.trigger("error.status.s2", [arguments[2]]);
          }, this));
      },

      setupController : function(inputModel, selector) {
        this.config = config;
        this.owner = owner;
        var component = imager({labware: config.initialLabware});
        var view = this.view = selector();
        view.html(_.template(template, { config: config}));
        view.append(component.view);
        
        view.append($('<div><span class="filename"></span></div>'));
        //view.on(component.events);
        this.imagerView = component;
        
        // config buttons
        config.initialLabware.order().then(function(orderObj) {
          var role = config.output[0].role;
          var item = _.find(orderObj.items[role], function(node) {
            return node.uuid===config.initialLabware.uuid;
          });
          configButtons(item && item.status);
        });
        
        this.focus();
        
        this.model = Object.create(Model).init(this, config);
        this.model
        .then(function (model) {
          return model.setup(inputModel);
        });
        this.dataParams = {
        gel_image: {
          image: ""
        }
        };
        
        connect(this.imagerView.events, "onBegin", this, "beginImager");
        connect(this.imagerView.events, "onEnd", this, "endImager");
        connect(this.imagerView.events, "onSelectedFile", this, "selectFile");
        connect(this.imagerView.events, "onUploadedFile", this, "upload");
        
        return this;
      }, release : function() {},
      initialController: function(){
      },
      focus: function() {
        //this.imagerView.view.trigger("activate.s2");
      }
    };
  }
});
