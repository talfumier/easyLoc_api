import express from "express";
import {Customer, Vehicle} from "../models/mongoDBModels.js";
import {routeHandler} from "../middleware/routeHandler.js";
import {getModels, validateContract} from "../models/sqlServerModels.js";
import {BadRequest} from "../models/validation/errors.js";
import {validateIntegerId} from "../models/validation/joiUtilityFunctions.js";

const router = express.Router();

let Contract = null;
function setModel(req, res, next) {
  Contract = getModels().Contract;
  next();
}

router.get(
  "/",
  setModel,
  routeHandler(async (req, res) => {
    const conts = await Contract.findAll();
    res.send({status: "OK", data: conts});
  })
);
router.get(
  "/:id",
  setModel,
  routeHandler(async (req, res) => {
    const id = req.params.id;
    const {error} = validateIntegerId(id);
    if (error) return res.send(new BadRequest(error.details[0].message));
    const cont = await Contract.findByPk(id);
    if (!cont)
      return res.send(new BadRequest(`Contract with id:${id} not found.`));
    res.send({
      status: "OK",
      data: cont,
    });
  })
);
const checkValidId = async (Model, txt, id) => {
  //Model > mongoDB model
  const doc = await Model.findById(id);
  if (!doc) return [false, new BadRequest(`${txt} with id:${id} not found.`)];
  return [true];
};
router.post(
  "/",
  setModel,
  routeHandler(async (req, res) => {
    const {error} = validateContract(req.body, "post");
    if (error) return res.send(new BadRequest(error.details[0].message));
    let ck = await checkValidId(Vehicle, "Vehicle", req.body.vehicle_id); //check vehicle does exist
    if (!ck[0]) return res.send(ck[1]);
    ck = await checkValidId(Customer, "Customer", req.body.customer_id); //check customer does exist
    if (!ck[0]) return res.send(ck[1]);
    const cont = await Contract.create(req.body);
    res.send({
      status: "OK",
      message: "Contract successfully created",
      data: cont,
    });
  })
);
router.patch(
  "/:id",
  setModel,
  routeHandler(async (req, res) => {
    const id = req.params.id;
    let error = validateIntegerId(id).error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    if (req.body.vehicle_id) {
      const ck = await checkValidId(Vehicle, "Vehicle", req.body.vehicle_id); //check vehicle does exist
      if (!ck[0]) return res.send(ck[1]);
    }
    if (req.body.customer_id) {
      const ck = await checkValidId(Customer, "Customer", req.body.customer_id); //check customer does exist
      if (!ck[0]) return res.send(ck[1]);
    }
    error = validateContract(req.body, "patch").error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    const cont = await Contract.findByPk(id);
    if (!cont)
      return res.send(new BadRequest(`Contract with id:${id} not found.`));
    await cont.update(req.body);
    res.send({
      status: "OK",
      message: `Contract with id:${id} successfully updated.`,
      data: cont,
    });
  })
);
router.delete(
  "/:id",
  setModel,
  routeHandler(async (req, res) => {
    const id = req.params.id;
    const {error} = validateIntegerId(id);
    if (error) return res.send(new BadRequest(error.details[0].message));
    const cont = await Contract.findByPk(id);
    if (!cont)
      return res.send(new BadRequest(`Contract with id:${id} not found.`));
    await cont.destroy();
    res.send({
      status: "OK",
      message: `Contract with id:${id} successfully deleted.`,
      data: cont,
    });
  })
);

export default router;
