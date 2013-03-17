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

define(['config'
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction_2.json'
],
    function (config,dataJSON) {

      var BasePresenter = Object.create(null);

      $.extend(BasePresenter, {
            init:function (owner, presenterFactory) {
              this.presenterFactory = presenterFactory;
              this.owner = owner;
              return this;
            },
            getS2Root:function () {
              var deferredS2Root = new $.Deferred();
              if (!this.s2Root) {
                var that = this;
                this.owner.getS2Root().done(function (result) {
                  that.s2Root = result;
                  deferredS2Root.resolve(result);
                }).fail(function () {
                      deferredS2Root.reject();
                    });
              } else {
                deferredS2Root.resolve(this.s2Root);
              }
              return deferredS2Root.promise();
            },
            getLabwareResourcePromise:function (resourceDetails) {
              var deferredS2Resource = new $.Deferred();

              var rsc,that = this;

              if (!this.stash_by_BC) this.stash_by_BC = {};
              if (!this.stash_by_UUID) this.stash_by_UUID = {};

              if (resourceDetails.uuid) {
                rsc = this.stash_by_UUID[resourceDetails.uuid];
                if (rsc) {
                  return deferredS2Resource.resolve(rsc).promise();
                } else {
                  debugger;
                  return deferredS2Resource.reject().promise();
                }
              }

              if (resourceDetails.barcode) {
                rsc = this.stash_by_BC[resourceDetails.barcode];
                if (rsc) {
                  return deferredS2Resource.resolve(rsc).promise();
                } else {

                  this.getS2Root()
                      .then(function (root) {
                        config.setupTest(dataJSON);
                        return root.tubes.findByEan13Barcode(resourceDetails.barcode);
                      }).then(function (result) {
                        rsc = result;
                        that.stash_by_BC[resourceDetails.barcode] = rsc;
                        that.stash_by_UUID[rsc.uuid] = rsc;
                         deferredS2Resource.resolve(rsc);
                      }).fail(function () {
                         deferredS2Resource.reject();
                      });
                }
              }
              return deferredS2Resource.promise();
            },
            resetS2Root:function () {
              this.s2Root = undefined;
              return this;
            },
            setupPlaceholder:function (jquerySelection) {
              this.jquerySelection = jquerySelection;
              return this;
            }
          }
      );

      return BasePresenter;
    });
