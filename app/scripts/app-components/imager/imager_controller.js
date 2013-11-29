define([ "config", "app-components/imager/imager", "models/selection_page_model" , "lib/pubsub", 'mapper/operations', "text!app-components/imager/header.html"
], function(appConfig, imager, Model, PubSub, Operations, template) {
  "use strict";
    
  return (
    { register : function(callback) {
      return callback("imager", imagerController);
    }
    });
  
  function configButtons(status) {
    var buttons = $("button.imager");
    var renderButtons = {
      "in_progress": function() {
        buttons.prop("disabled", true);
        $(buttons[0]).prop("disabled", false);
      },
      "done": function() {
        buttons.prop("disabled", false);
        $(buttons[0]).prop("disabled", true);
        $(buttons[1]).prop("disabled", true);
      },
      "default": function() {
        buttons.prop("disabled", true);
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
      
      setupController : function(inputModel, selector) {
        this.config = config;
        this.owner = owner;
        var component = imager({labware: config.initialLabware});
        var view = selector();
        var text = "<div class=\"row\" >";
        text += "<div class=\"span9\">";
        text += "<h3 id=\"process-title\" >"+ config.processTitle + "</h3>";
        text += "</div>";
        text += "</div >";
        view.html(text);
        view.append(component.view);
        
        view.append($('<div class="filename"><span class="filename"></span></div>'));
        view.on(component.events);
        this.component = component;
        
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
        view.on("begin.imager.s2", _.partial(function(model) {
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
        }, this.model));
        
        view.on("completed.imager.s2", _.partial(function(model) {
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
         }).then(function() {
           configButtons("done");
         });          
        }, this.model));        

        this.model
        .then(function (model) {
          return model.setup(inputModel);
        });
        
        var dataParams = {
          out_of_bounds: {
            image: ""
          }
        };
        view.on("uploaded.request.imager.s2", _.partial(function(file, event, data) {
          file.image = window.btoa(data.content);
          file.dataType = "BASE64";
          view.on("done.s2", function() {
            configButtons("done");            
          });
        }, dataParams.out_of_bounds));
        
        view.on("upload.request.imager.s2", _.partial(function(dataParams, model, uuid) {
          // This must be moved to S2 Mapper
          var url = appConfig.apiUrl + "lims-laboratory";
          var promiseQuery = $.ajax(url+"/"+uuid,
            {
              headers :
              {
                Accept : "application/json; charset=utf-8",
                "Content-Type" : "application/json; charset=utf-8"
              }, 
              data : JSON.stringify(dataParams),
              method : "PUT"
            }).then(function() {
              PubSub.publish("message.status.s2", this, {message: 'Uploaded file'});
            });
        }, dataParams, this.model, uuid));
        
        return this;
      }, release : function() {},
      initialController: function(){
      },
      focus: function() {
        this.component.view.trigger("activate.s2");
      }
    };
  }
});
