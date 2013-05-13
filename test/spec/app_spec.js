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


define(['scripts/app'], function (app) {
//  'use strict';

  describe("Main App controller init", function () {
    var mainApp;
    var presenterFactory;

    function configureSpyPresenterFactory() {
      presenterFactory = {};
      presenterFactory.createDefaultPresenter = function (owner) {
      };
    }

    beforeEach(function () {
      configureSpyPresenterFactory();
      mainApp = new app(presenterFactory);
    });

    it("app can be instanciated", function () {
      expect(mainApp).toBeDefined();
    });

  })
  describe("Main App controller init", function () {
    var mainApp;
    var presenterFactory;
    var fakeWorkflow;
    var fakePresenter;

    function configureSpyPresenterFactory() {
      presenterFactory = {};
      presenterFactory.createDefaultPresenter = function (owner) {
      };

      spyOn(presenterFactory, 'createDefaultPresenter').andCallFake(function(){
        return fakePresenter;
      })
    }

    function configureSpyWorkflow() {
      fakeWorkflow = {};
      fakeWorkflow.getNextPresenter = function (getNextPresenter, data) {
      };
      spyOn(fakeWorkflow, 'askForNextPresenter').andCallFake(function(){
        return fakePresenter;
      });
    }

    function configureSpyFakePresenter() {
      fakePresenter = {};

      fakePresenter.setupPresenter = function (data) {
      };
      fakePresenter.renderView = function () {
      };
      fakePresenter.release = function () {
      };

      spyOn(fakePresenter, 'setupPresenter').andCallThrough();
      spyOn(fakePresenter, 'renderView').andCallThrough();
      spyOn(fakePresenter, 'release').andCallThrough();
    }

    function configuresSpiesOnMainApp(){
      mainApp.updateModel = function (data) {};
      spyOn(mainApp, 'updateModel');
    }

    beforeEach(function () {
      configureSpyFakePresenter();
      configureSpyPresenterFactory();
      configureSpyWorkflow();

      mainApp = new app(presenterFactory);
      mainApp.workflow = fakeWorkflow; // inject fake workflow
      var inputDataForModel = {
        user:"1234567890",
        labwareUUID:"1234567890",
        batchUUID:"1234567890"
      };
      mainApp.updateModel(inputDataForModel);

    });

    it("app calls the workflow after setupPresenter()", function () {
      mainApp.setupPresenter({});
      expect(fakeWorkflow.askForNextPresenter).toHaveBeenCalled();
    });

    it("app calls the workflow after updateModel()", function () {
      expect(fakeWorkflow.askForNextPresenter).toHaveBeenCalled();
    });

    it("calling childDone() on app with action='done' calls updateModel()", function () {
      var inputDataForModel = {
        user:"",
        labwareUUID:"",
        batchUUID:""
      };
      configuresSpiesOnMainApp();
      mainApp.childDone(undefined, "done", inputDataForModel);

      expect(mainApp.updateModel).toHaveBeenCalled();
    });

    xit("calling childDone() on app with action='login' calls updateModel()", function () {
      var inputDataForModel = {
        user:"",
        labwareUUID:"",
        batchUUID:""
      };
      configuresSpiesOnMainApp();
      mainApp.childDone(undefined, "login", inputDataForModel);

      expect(mainApp.updateModel).toHaveBeenCalled();
    });

    it("calling childDone() on app with wrong action='' does not call updateModel()", function () {
      var inputDataForModel = {
        user:"",
        labwareUUID:"",
        batchUUID:""
      };
      configuresSpiesOnMainApp();
      mainApp.childDone(undefined, "random", inputDataForModel);

      expect(mainApp.updateModel).not.toHaveBeenCalled();
    });

    it("calling childDone() on app with action='login' but wrong data does throw", function () {
      var inputDataForModel = undefined;
//      configuresSpiesOnMainApp();
      var f = function () {
        mainApp.childDone(undefined, "login", inputDataForModel);
      }
      expect(f).toThrow("DataSchemaError");
    });

  })
});
