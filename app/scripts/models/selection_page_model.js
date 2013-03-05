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

define(['extraction_pipeline/dummyresource'], function (rsc) {

  var SelectionPageModel = function (owner, input_model) {
    /* Creates the default implementation of a selection page model
     * with a user identifier and some orders
     *
     * Arguments
     * ---------
     * owner
     * input_model = {userBC:"1234567890", labwareBC:"1234567890", batchUUID:"1234567890"}
     */
    console.log("model constructor, with data :" , input_model);
    this.owner = owner;
    this.user = input_model.userBC;
    this.batch = input_model.batchUUID;
    this.seminalLabwareBC = input_model.labwareBC;


    this.tubes = [];
    this.capacity = 12;



    return this;
  }


  SelectionPageModel.prototype.retrieveTubeDetails = function (index, tubeUUID) {
    console.log('retrieveTubeDetails');
//    var that = this;
//    var theRsc;
//    rsc_path = tubeUUID;
//    new rsc(rsc_path, "read")
//      .done(function (s2rsc) {
//        theRsc = s2rsc;
//      })
//      .fail(function () {
//        // TODO: deal with error reading the order
//      })
//      .then(function () {
//        try {
//          that.addTubeResource(theRsc, index, tubeUUID);
//        }
//        catch (e) {
//          that.owner.childDone(that, "error", e);
//        }
//      });
  };

  SelectionPageModel.prototype.addTubeResource = function (resource, index, tubeUuid) {
    console.log("tube has been found ");

    this.validateBatchUuid(resource);
    this.validateTubeUuid(resource.rawJson.tube.uuid);
    console.log("index ", index);


    this.tubes[index] = resource;
    var data = {index:index, tubeUUID:tubeUuid};
    console.log(this);
    this.owner.childDone(this, "foundTube", data);
  }

  SelectionPageModel.prototype.validateBatchUuid = function (resource) {
    var tubeJson = resource.rawJson && resource.rawJson.tube;
    var batchJson = tubeJson && tubeJson.batch && tubeJson.batch.rawJson;
    var batchUuid = batchJson && batchJson.uuid;

    console.log("tubeJson ", tubeJson);
    console.log("batchJson ", batchJson);
    console.log("batch uuid ", batchUuid);
    console.log("batch ", this.batch);
    if (this.batch === undefined) {
      this.batch = batchUuid;
    }
    else if (batchUuid !== this.batch) {
      console.log("Not adding tube with different batch to selection page model");
      throw {type:"UuidMismatch",
        message:"Tube in different batch to currently selected tubes." };
    }

  }

  SelectionPageModel.prototype.validateTubeUuid = function (uuid) {
    var tube;
    for (var i = 0; i < this.tubes.length; i++) {
      tube = this.tubes[i];
      if (tube) {
        if (tube.rawJson && tube.rawJson.tube && (tube.rawJson.tube.uuid === uuid)) {
          throw {type:"UuidMismatch",
            message:"This tube has already been scanned." }
        }
        else {
          console.log("found tube with uuid ", tube.rawJson && tube.rawJson.uuid);
          console.log("original uuid is ", uuid);
        }
      }
    }
  };


  SelectionPageModel.prototype.retrieveBatchFromSeminalLabware = function () {
    // For now
    console.log('retrieveBatchFromSeminalLabware, ', this.seminalLabwareBC);
//
//    this.tubes = ["11111111-2222-3333-4444-000000000000"];

    if (this.seminalLabwareBC){
      this.addTube(this.seminalLabwareBC);
    }

  };


  SelectionPageModel.prototype.addTube = function (newTubeUUID) {
    /* add tube
     *
     * Adds an tube to this model.
     *
     * Arguments
     * ---------
     * newTubeUUID: the new tube to add
     *
     * Exceptions
     * ----------
     * SelectionPageException:  If the number of orders is already saturated
     * SelectionPageException:  If the batch id does not match the current order
     *
     */
    console.log("model add tube, ", newTubeUUID);

    if (this.tubes.length > this.capacity - 1) {
      throw {"type":"SelectionPageException", "message":"Only " + this.capacity + " orders can be selected" };
    }

//    this.retrieveTubeDetails(lastTubeIndex, newTubeUUID);
    this.tubes.push(newTubeUUID);
    //var lastTubeIndex = this.tubes.length;
    this.owner.childDone(this, "modelUpdated");
    console.log("addedTube");
    return this;
  };

  SelectionPageModel.prototype.getTubeUuidFromTubeIndex = function (index) {
    /* reads the uuid corresponding to the tube at the given index
     *
     * Returns
     * -------
     * The uuid of the tube in the orders array at index 'index'
     *
     * Arguments
     * ---------
     * index : the index in the tubes array
     */
    var order = this.tubes[index];
    return order.rawJson.tube.uuid;
  };

  SelectionPageModel.prototype.getCapacity = function () {
    /* gets the capacity of the model
     *
     * Returns
     * -------
     * The capacity
     */
    return this.capacity;
  };

  SelectionPageModel.prototype.removeTubeByUuid = function (uuid) {
    /* removes a tube matching a given uuid
     *
     * Arguments
     * ---------
     * uuid - the uuid of the tube to remove
     */
    var index = -1;

    for (var i = 0; i < this.tubes.length; i++) {
      if (this.tubes[i].rawJson.tube.uuid === uuid) {
        this.tubes.splice(i, 1);
        index = i;
        break;
      }

    }

    if (this.tubes.length === 0) {
      this.batch = undefined;
    }

    return index;
  };

  SelectionPageModel.prototype.getNumberOfTubes = function () {
    /* gets the number of tubes
     *
     * Returns
     * -------
     * The number of tubes.
     */
    return this.tubes.length;
  };

  return SelectionPageModel;

});
