/*
 * S2 - An open source lab information management systems (LIMS)
 * Copyright (C) 2013  Wellcome Trust Sanger Insitute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 1, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA  02110-1301 USA
 */


define([
  'scripts/workflow_engine'
  , 'config'
  , 'text!/json/workflow_test_data.json'
], function (WorkflowEngine, config, testData) {
  'use strict';

  testData = $.parseJSON(testData);
  var configurationFile = undefined;
  describe("There is a workflow engine:-", function () {
    beforeEach(function () {
      var useCase = "useCase1";
      configurationFile = testData[useCase]["workflowConfig"];
    });

    it("workflow engine is instantiated", function () {
      var workflowEngine = new WorkflowEngine(undefined, configurationFile);
      expect(workflowEngine).toBeDefined();
    });

    it("workflow engine has the expected methods", function () {
      var workflowEngine = new WorkflowEngine(undefined, configurationFile);

      expect(workflowEngine.askForNextPresenter).toBeDefined();
      expect(typeof workflowEngine.askForNextPresenter).toEqual("function");
    });

    it("workflow engine can read configuration file", function () {
      var workflowEngine = new WorkflowEngine(undefined, configurationFile);
      expect(workflowEngine.role_priority).toBeDefined();
      expect(typeof workflowEngine.role_priority).toEqual("object");
    });

    it("configuration inside the engine is well formed... (not just really testing the workflowEngine)", function () {
      var workflowEngine = new WorkflowEngine(undefined, configurationFile);
      expect(workflowEngine.role_priority).toBeDefined();
      expect(Array.isArray(workflowEngine.role_priority)).toBeTruthy();
      expect(workflowEngine.role_priority.length).toEqual(3);
      expect(typeof workflowEngine.role_priority[0]).toEqual("object");
      expect(workflowEngine.role_priority[0][0]).toEqual("roleA");
      expect(workflowEngine.role_priority[0][1]).toEqual("A_2_B_presenter");
      expect(workflowEngine.default).toBeDefined();
      expect(Array.isArray(workflowEngine.default)).toBeFalsy();
      expect(workflowEngine.default).toEqual("default_presenter");
    });
  });


  describe("The workflow works: ", function () {

    var useCase = "useCase1";
    var tests = testData[useCase]["tests"];
    var configurationFile = testData[useCase]["workflowConfig"];

    it("in " + useCase + " we have the correct presenters", function () {
      for (var testName in tests) {
        var inputData = tests[testName]["input"]["batch"];
        var expectedPresenterName = tests[testName]["expected"]["pagePresenter"];
        var workflowEngine = new WorkflowEngine(undefined, configurationFile);
        var calculatedPresenterName = workflowEngine.getNextPresenterName(inputData);
        console.log(testName, inputData, expectedPresenterName);

        expect(calculatedPresenterName).toEqual(expectedPresenterName);
      }
    });
  });

  describe("The workflow works: ", function () {
    var useCase = "useCase2";
    var tests = testData[useCase]["tests"];
    var configurationFile = testData[useCase]["workflowConfig"];

    it("in " + useCase + " we have the correct presenters", function () {
      for (var testName in tests) {
        var inputData = tests[testName]["input"]["batch"];
        var expectedPresenterName = tests[testName]["expected"]["pagePresenter"];
        var workflowEngine = new WorkflowEngine(undefined, configurationFile);
        var calculatedPresenterName = workflowEngine.getNextPresenterName(inputData);
        expect(calculatedPresenterName).toEqual(expectedPresenterName);
      }
    });
  });
});
