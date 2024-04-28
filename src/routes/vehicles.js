import express from "express";
import aqp from "api-query-params";
import {routeHandler} from "../middleware/routeHandler.js";
import {Vehicle, validateVehicle} from "../models/mongoDbModels.js";
import {BadRequest} from "../models/validation/errors.js";
import {validateObjectId} from "../models/validation/joiUtilityFunctions.js";
import {getModels} from "../models/sqlServerModels.js";

const router = express.Router();

let Contract = null;
function setModel(req, res, next) {
  Contract = getModels().Contract; //SQL server model
  next();
}

router.get(
  "/",
  routeHandler(async (req, res) => {
    const {filter, sort} = aqp(req.query);
    const vcls = await Vehicle.find(filter).sort(sort);
    res.send({status: "OK", data: vcls});
  })
);
router.get(
  "/:licence_plate",
  routeHandler(async (req, res) => {
    const {error} = validateVehicle(req.params, "get");
    if (error) return res.send(new BadRequest(error.details[0].message));
    const {licence_plate} = req.params;
    const vcl = await Vehicle.findOne({
      licence_plate: {$regex: new RegExp(licence_plate, "i")}, //case insensitive search
    });
    let status = "OK";
    if (!vcl) status = `Vehicle ${licence_plate} not found.`;
    res.send({status, data: vcl});
  })
);
router.post(
  "/",
  routeHandler(async (req, res) => {
    const {error} = validateVehicle(req.body, "post");
    if (error) return res.send(new BadRequest(error.details[0].message));
    let vcl = await Vehicle.findOne({
      licence_plate: req.body.licence_plate.trim(),
    });
    if (vcl) return res.send(new BadRequest("Vehicle already registered."));
    vcl = new Vehicle(req.body);
    await vcl.save();
    res.send({
      status: "OK",
      message: "Vehicle successfully created",
      data: vcl,
    });
  })
);
router.patch(
  "/:id",
  routeHandler(async (req, res) => {
    const _id = req.params.id;
    let error = validateObjectId(_id).error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    error = validateVehicle(req.body, "patch").error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    const vcl = await Vehicle.findOneAndUpdate({_id}, req.body, {
      new: true,
    });
    if (!vcl)
      return res.send(new BadRequest(`Vehicle with id:${_id} not found.`));
    res.send({
      status: "OK",
      message: `Vehicle with id:${_id} successfully updated.`,
      data: vcl,
    });
  })
);
router.delete(
  "/:id",
  setModel,
  routeHandler(async (req, res) => {
    const _id = req.params.id;
    const {error} = validateObjectId(_id);
    if (error) return res.send(new BadRequest(error.details[0].message));
    const cont = await Contract.findOne({where: {vehicle_id: _id}});
    if (cont)
      return res.send(
        new BadRequest(
          `Vehicle with id:${_id} cannot be deleted due to related records in 'contracts' table.`
        )
      );
    const vcl = await Vehicle.findByIdAndDelete(_id);
    if (!vcl)
      return res.send(new BadRequest(`Vehicle with id:${_id} not found.`));
    res.send({
      status: "OK",
      message: `Vehicle with id:${_id} successfully deleted.`,
      data: vcl,
    });
  })
);
export default router;
