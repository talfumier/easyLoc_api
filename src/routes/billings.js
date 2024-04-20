import express from "express";
import {Customer, Vehicle} from "../models/mongoDBModels.js";
import {routeHandler} from "../middleware/routeHandler.js";
import {getModels, validateBilling} from "../models/sqlServerModels.js";
import {BadRequest} from "../models/validation/errors.js";
import {validateIntegerId} from "../models/validation/joiUtilityFunctions.js";

const router = express.Router();

let Contract,
  Billing = null;
function setModels(req, res, next) {
  const models = getModels();
  Contract = models.Contract;
  Billing = models.Billing;
  next();
}

router.get(
  "/",
  setModels,
  routeHandler(async (req, res) => {
    const bills = await Billing.findAll();
    res.send({status: "OK", data: bills});
  })
);
router.get(
  "/:id",
  setModels,
  routeHandler(async (req, res) => {
    const id = req.params.id;
    const {error} = validateIntegerId(id);
    if (error) return res.send(new BadRequest(error.details[0].message));
    const bill = await Billing.findByPk(id);
    if (!bill)
      return res.send(new BadRequest(`Billing with id:${id} not found.`));
    res.send({
      status: "OK",
      data: bill,
    });
  })
);
const checkValidId = async (Model, txt, id) => {
  //Model > sequelize model
  let rec = Number.isInteger(id);
  if (rec) rec = await Model.findByPk(id);
  if (!rec) return [false, new BadRequest(`${txt} with id:${id} not found.`)];
  return [true];
};
router.post(
  "/",
  setModels,
  routeHandler(async (req, res) => {
    const {error} = validateBilling(req.body, "post");
    if (error) return res.send(new BadRequest(error.details[0].message));
    const ck = await checkValidId(Contract, "Contract", req.body.contract_id); //check contract does exist
    if (!ck[0]) return res.send(ck[1]);
    const bill = await Billing.create(req.body);
    res.send({
      status: "OK",
      message: "Billing successfully created",
      data: bill,
    });
  })
);
router.patch(
  "/:id",
  setModels,
  routeHandler(async (req, res) => {
    const id = req.params.id;
    let error = validateIntegerId(id).error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    if (req.body.contract_id) {
      const ck = await checkValidId(Contract, "Contract", req.body.contract_id); //check contract does exist
      if (!ck[0]) return res.send(ck[1]);
    }
    error = validateBilling(req.body, "patch").error;
    if (error) return res.send(new BadRequest(error.details[0].message));
    const bill = await Billing.findByPk(id);
    if (!bill)
      return res.send(new BadRequest(`Billing with id:${id} not found.`));
    await bill.update(req.body);
    res.send({
      status: "OK",
      message: `Billing with id:${id} successfully updated.`,
      data: bill,
    });
  })
);
router.delete(
  "/:id",
  setModels,
  routeHandler(async (req, res) => {
    const id = req.params.id;
    const {error} = validateIntegerId(id);
    if (error) return res.send(new BadRequest(error.details[0].message));
    const bill = await Billing.findByPk(id);
    if (!bill)
      return res.send(new BadRequest(`Billing with id:${id} not found.`));
    await bill.destroy();
    res.send({
      status: "OK",
      message: `Billing with id:${id} successfully deleted.`,
      data: bill,
    });
  })
);

export default router;
