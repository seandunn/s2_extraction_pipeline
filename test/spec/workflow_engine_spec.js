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
  , 'text!scripts/pipeline_config.json'
], function (WorkflowEngine, config, testData) {
  'use strict';

  describe("WorkflowEngine:-",function(){
    var testConfig, workflowEngine, presenterData;

    beforeEach(function(){
      testConfig     = $.parseJSON(testData);
      workflowEngine = new WorkflowEngine(undefined, testConfig);
    });

    describe("Loading the workflow,", function(){
      it("is instantiated.", function () {
        expect(workflowEngine).toBeDefined();
      });

      it("an askForNextPresenter method.", function () {
        expect(typeof workflowEngine.askForNextPresenter).toEqual("function");
      });

      it("has a role priority array.", function () {
        expect(workflowEngine.role_priority instanceof Array).toBe(true);
      });

      it("has a role configuration object.", function(){
        expect(typeof workflowEngine.role_configuration).toEqual("object");
      });

      it("has a defaultPresenter attribute.", function(){
        expect(workflowEngine.defaultPresenter).toBeDefined();
      });


      describe("A formed pipeline_config.json file,", function(){
        it("has a matching number of roles and rolePriority entries.", function(){
          expect(workflowEngine.role_priority.length).toEqual(_.keys(workflowEngine.role_configuration).length);
        });

        it("has role_priority entries which are strings.", function () {
          expect(typeof workflowEngine.role_priority[0]).toEqual("string");
        });
      });
    });

    describe("Passing in an empty set of roles,", function (){

      beforeEach(function(){
        presenterData = workflowEngine.getMatchingRoleDataFromItems([]);
      });

      it("returns the default presenter.", function(){
        expect(presenterData.presenterName).toEqual("default_presenter");
      });
    });

    describe("Looking up a presenter for a DNA+P tube,", function (){

      beforeEach(function(){
        presenterData = workflowEngine.getMatchingRoleDataFromItems([{
          "uuid":  "UUID_FOR_DNAP_TUBE",
          "status":"done",
          "role":  "samples.extraction.manual.dna_and_rna.input_tube_nap"
        }]);
      });

      it("returns the default presenter.", function(){
        expect(presenterData.presenterName).toEqual("selection_page_presenter");
      });
    });

  });


});
