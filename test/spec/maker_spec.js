/* global sinon, describe, beforeEach, afterEach, it */
define([
  "mapper/s2_root",
  "app-components/manifest/maker"
], function(S2Root, Maker) {
  "use strict";

  describe("Maker Component", function() {

    var maker,
        $dom = $("<div id=\"content\"></div>");

    describe("Custom fields", function() {

      afterEach(function() {
        maker = null;
        $dom.empty();
      });

      describe("A template with no custom fields", function() {
        beforeEach(function() {

          maker = new Maker({
            templates: getTemplate(templateFixture2)
          });

          $dom.append(maker.view).on(maker.events);
        });

        it("will have nothing in the custom fields div", function() {
          expect($dom.find("#custom-fields > *").size()).to.equal(0);
        });

      });

      describe("A template with one custom field", function() {

        beforeEach(function() {

          maker = new Maker({
            templates: getTemplate(templateFixture1, customFieldFixture1)
          });

          $dom.append(maker.view).on(maker.events);
        });

        it("will render a reception form with one custom field", function() {
          var $customFieldDiv = $dom.find("#custom-fields > div");
          
          expect($customFieldDiv.size()).to.equal(1);
          
          testCustomFieldDiv($customFieldDiv, {
            labelText : "Test field:",
            inputId   : "testId",
            inputValue: "1"
          });

        });  
      });

      describe("A template with multiple custom fields", function() {
        beforeEach(function() {
          maker = new Maker({
            templates: getTemplate(
                         templateFixture1,
                         customFieldFixture1,
                         customFieldFixture2
                       )
          });

          $dom.append(maker.view).on(maker.events);
        });

        it("will render a reception form with multiple custom fields", function() {
          var $customFieldDiv = $dom.find("#custom-fields > div");
          expect($customFieldDiv.size()).to.equal(2);

          var $firstCustomFieldDiv  = $customFieldDiv.eq(0),
              $secondCustomFieldDiv = $customFieldDiv.eq(1);

          testCustomFieldDiv($firstCustomFieldDiv, {
            labelText : "Test field:",
            inputId   : "testId",
            inputValue: "1"
          });
          
          testCustomFieldDiv($secondCustomFieldDiv, {
            labelText : "Test field 2:",
            inputId   : "testId2",
            inputValue: "100"
          });
        });

      });

      describe("Multiple templates, the first with no custom fields, the second with some", function() {

        beforeEach(function() {
          maker = new Maker({
            templates: _.extend(
              {},
              getTemplate(templateFixture1),
              getTemplate(templateFixture2, customFieldFixture1)
            )
          });

          $dom.append(maker.view).on(maker.events);
        });

        it("will not show any custom fields at first", function() {
          expect($dom.find("#custom-fields > *").size()).to.equal(0);
        });

        it("will show the custom fields when a template with custom fields is selected", function() {
          // Have to fire the "change" event manually because we're altering the value using
          // jQuery (which doesn't automatically fire a change event like manually selecting an
          // option would)
          $dom.find("select#xls-templates").val("test2").change(); 

          var $customFieldDiv = $dom.find("#custom-fields > div");
          expect($customFieldDiv.size()).to.equal(1);

          testCustomFieldDiv($customFieldDiv, {
            labelText : "Test field:",
            inputId   : "testId",
            inputValue: "1"
          });
        });

        it("will hide the custom fields when a template without custom fields is selected", function() {
          $dom.find("select#xls-templates").val("test2").change();
          $dom.find("select#xls-templates").val("test").change();

          var $customFieldDiv = $dom.find("#custom-fields > *");
          expect($customFieldDiv.size()).to.equal(0);          
        });

      });
      
      describe("A custom field with a validation method that fails", function() {
        var stub, spy;

        beforeEach(function(done) {
          var templates = getTemplate(templateFixture1, customFieldFixture3);   

          spy = sinon.spy();

          stub = sinon.stub().returns(false);
          templates.test.custom_fields[0].validation = stub;

          maker = new Maker({
            templates: templates,
            getS2Root: getS2Root
          });

          $dom.append(maker.view).on(maker.events);
          $dom.on("error.status.s2", spy)

          $dom.find("#generateManifest").click();

          // Bloody async code
          setTimeout(done, 500);
        });

        it("should have the validation method called with the value of the field when the manifest is created", function() {
          expect(spy).to.have.been.called;
          expect(stub).to.have.been.calledWith(100);
        });
      });

    });

  });

  // Some easy to get to fixtures...

  function getTemplate(template /* ..args.. */) {
    var customFieldFixtures = _.drop(arguments, 1);
    if (customFieldFixtures < 1) {
      return template();
    } else {
      return addCustomFields.apply(null, [template()].concat(customFieldFixtures));
    }
  }

  function templateFixture1() {
    return {
      test: {
        friendly_name: "Test manifest",
        sample_types: {},
        studies: {
          Foo: {
            friendly_name: "The really important foo study",
            sanger_sample_id_core: "fooooooo"
          }
        },
        generator: {
          prepare: function() {
            // Prepare returns the model
            return {
              labwareOutputs: {},
              manifestBlob: new Blob(["<p>My lovely mocked up blob</p>"], {type: "text/html"})
            }
          },
          resources: _.ignore
        },
        custom_fields: []
      }
    };
  }

  function templateFixture2() {
    return {
      test2: {
        friendly_name: "Test manifest 2",
        sample_types: {},
        studies: {},
        custom_fields: []
      }
    }; 
  }

  function customFieldFixture1() {
    return {
      friendly_name: "Test field",
      id: "testId",
      initial_value: 1
    }
  }

  function customFieldFixture2() {
    return {
      friendly_name: "Test field 2",
      id: "testId2",
      initial_value: 100
    };
  }

  function customFieldFixture3() {
    return {
      friendly_name: "Test field 3",
      id: "testId3",
      initial_value: 100,
      validation: function() {}
    };
  }

  function addCustomFields(template /* ..args.. */) {
    return _.reduce(_.drop(arguments, 1), function(memo, customFieldFn) {
      _.chain(template)
        .values()
        .first()
        .tap(function(obj) {
          obj.custom_fields.push(customFieldFn());
        })
        .value();

      return template;

    }, template);
  }

  function testCustomFieldDiv($elem, expectations) {
    expect($elem.find("label").text()).to.equal(expectations.labelText);
    expect($elem.find("input").attr("id")).to.equal(expectations.inputId);
    expect($elem.find("input").val()).to.equal(expectations.inputValue);
  }

  function getS2Root() {
    var deferred = new $.Deferred();

    S2Root.load({user: "username"})
      .then(function(result) {
        deferred.resolve(result);
      }, function() {
        deferred.reject();
      });

    return deferred.promise();
  }

});