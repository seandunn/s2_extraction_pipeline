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
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/2.json'
],
  function (config, dataJSON) {

    var BasePresenter = Object.create(null);

    $.extend(BasePresenter, {
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
