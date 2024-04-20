import express from "express";
import aqp from "api-query-params";
import {routeHandler} from "../middleware/routeHandler.js";
import {Customer, validateCustomer} from "../models/mongoDBModels.js";
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
    const custrs = await Customer.find(filter).sort(sort);
    res.send({status: "OK", data: custrs});
  })
);
router.get(
  "/:last_name/:first_name",
  routeHandler(async (req, res) => {
    const {error} = validateCustomer(req.params, "get");
    if (error) return res.send(new BadRequest(error.details[0].message));
    const {last_name, first_name} = req.params;
    const custr = await Customer.findOne({
      last_name: {$regex: new RegExp(last_name, "i")}, //case insensitive search
      first_name: {$regex: new RegExp(first_name, "i")},
    });
    let status = "OK";
    if (!custr) status = `Customer ${last_name} ${first_name} not found.`;
    res.send({status, data: custr});
  })
);
router.post(
  "/",
  routeHandler(async (req, res) => {
    const {error} = validateCustomer(req.body, "post");
    if (error) return res.send(new BadRequest(error.details[0].message));
    let custr = await Customer.findOne({
      first_name: req.body.first_name.trim(),
      last_name: req.body.last_name.trim(),
    });
    if (custr) return res.send(new BadRequest("Customer already registered."));
    custr = new Customer(req.body);
    await custr.save();
    res.send({
      status: "OK",
      message: "Customer successfully created",
      data: custr,
    });
  })
);
router.patch(
  "/:id",
  routeHandler(async (req, res) => {
    const _id = req.params.id;
    let error = validateObjectId(_id).error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    error = validateCustomer(req.body, "patch").error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    const custr = await Customer.findOneAndUpdate({_id}, req.body, {
      new: true,
    });
    if (!custr)
      return res.send(new BadRequest(`Customer with id:${_id} not found.`));
    res.send({
      status: "OK",
      message: `Customer with id:${_id} successfully updated.`,
      data: custr,
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
    const cont = await Contract.findOne({where: {customer_id: _id}});
    if (cont)
      return res.send(
        new BadRequest(
          `Customer with id:${_id} cannot be deleted due to related records in 'contracts' table.`
        )
      );
    const custr = await Customer.findByIdAndDelete(_id);
    if (!custr)
      return res.send(new BadRequest(`Customer with id:${_id} not found.`));
    res.send({
      status: "OK",
      message: `Customer with id:${_id} successfully deleted.`,
      data: custr,
    });
  })
);

export default router;
