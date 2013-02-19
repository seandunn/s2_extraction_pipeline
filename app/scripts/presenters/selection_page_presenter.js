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


define([], function() {

    var presenter = function(owner) {
	/* constructor
	 *
	 * Arguments
	 * ---------
	 * owner : the owner of this presenter. Expected to be the application controller
	 */
	this.owner = owner;
	this.model = undefined;
	this.view = undefined;
    }

    presenter.prototype.init = function() {
	/* initialises this instance by instantiating the view
	 */
	// TODO : instantiate view
    }

    presenter.prototype.update = function(model) {
	/* updates the data for the current view
	 */
	if (this.view) {
	    this.view.clear();
	    this.view.render(model);
	    }
    }

    presenter.prototype.release = function() {
	}
    
    return presenter;
});
