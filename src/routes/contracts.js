import express from "express";
import {Op, col, fn, literal} from "sequelize";
import {Customer, Vehicle} from "../models/mongoDBModels.js";
import {routeHandler} from "../middleware/routeHandler.js";
import {getModels, validateContract} from "../models/sqlServerModels.js";
import {BadRequest} from "../models/validation/errors.js";
import {
  validateIntegerId,
  validateObjectId,
} from "../models/validation/joiUtilityFunctions.js";

const router = express.Router();

let Contract = null,
  connection = null; // connection is an instance of sequelize
function setModel(req, res, next) {
  const models = getModels();
  Contract = models.Contract;
  connection = models.connection;
  next();
}
/*BASIC*/
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
/*SEARCH*/
router.get(
  "/search/queryparams",
  setModel,
  routeHandler(async (req, res) => {
    let customer_id = null,
      vehicle_id = null,
      cond = {},
      status = null;
    const keys = Object.keys(req.query); //query parameters keys
    if (keys.indexOf("customer_id") !== -1) {
      customer_id = req.query.customer_id;
      let error = validateObjectId(customer_id).error;
      if (error) return res.send(new BadRequest(error.details[0].message));
      cond = {...cond, customer_id};
    }
    if (keys.indexOf("vehicle_id") !== -1) {
      vehicle_id = req.query.vehicle_id;
      let error = validateObjectId(vehicle_id).error;
      if (error) return res.send(new BadRequest(error.details[0].message));
      cond = {...cond, vehicle_id};
    }
    if (keys.indexOf("status") === -1) status = "all";
    else status = req.query.status;
    switch (status) {
      case "ongoing":
        cond = {...cond, loc_returning_datetime: {[Op.eq]: null}};
        break;
      case "completed":
        cond = {...cond, loc_returning_datetime: {[Op.ne]: null}};
        break;
      case "late":
        cond = {
          ...cond,
          [Op.or]: [
            {
              [Op.and]: [
                {loc_returning_datetime: {[Op.eq]: null}},
                {
                  loc_end_datetime: {
                    [Op.lt]: fn(
                      "DATEADD",
                      literal("hour"),
                      -1,
                      literal("CURRENT_TIMESTAMP")
                    ),
                  },
                },
              ],
            },
            {
              [Op.and]: [
                {loc_returning_datetime: {[Op.ne]: null}},
                {
                  loc_returning_datetime: {
                    [Op.gt]: fn(
                      "DATEADD",
                      literal("hour"),
                      1,
                      col("loc_end_datetime")
                    ),
                  },
                },
              ],
            },
          ],
        };
        break;
      default: //returns all contracts
    }
    const conts = await Contract.findAll({
      where: cond,
      order: [[col("createdAt"), "DESC"]],
    });
    res.send({
      status: "OK",
      message: `List of ${status} contract(s) ${
        customer_id || vehicle_id ? "for " : ""
      }${customer_id ? "customer id:" + customer_id : ""}${
        customer_id && vehicle_id ? " and " : ""
      }${vehicle_id ? "vehicle id:" + vehicle_id : ""} successfully retrieved.`,
      data: conts,
    });
  })
);
function isDateValid(dateStr) {
  // dates format YYYY/MM/DD or MM/DD/YYYY return true
  if (!dateStr) return false;
  return !isNaN(new Date(dateStr));
}
router.get(
  "/search/delays",
  setModel,
  routeHandler(async (req, res) => {
    const keys = Object.keys(req.query); //query parameters keys
    let date1 = keys.indexOf("date1") !== -1 ? req.query.date1 : null;
    let date2 = keys.indexOf("date2") !== -1 ? req.query.date2 : null;
    if (!isDateValid(date1) || !isDateValid(date2))
      return res.send(
        new BadRequest("Missing date or invalid date format (YYYY/MM/DD).")
      );
    date1 = new Date(date1);
    date2 = new Date(date2);

    const conts = await Contract.findAll({
      attributes: [
        [
          fn("count", col("id")),
          `n_contracts late ${req.query.date1} - ${req.query.date2}`,
        ],
      ],
      where: {
        [Op.and]: [
          {loc_end_datetime: {[Op.between]: [date1, date2]}},
          {loc_returning_datetime: {[Op.gt]: col("loc_end_datetime")}},
        ],
      },
    });
    res.send({status: "OK", data: conts});
  })
);
/*GROUP BY*/
router.get(
  "/search/groupby/customer",
  setModel,
  routeHandler(async (req, res) => {
    const conts = await Contract.findAll({
      attributes: ["customer_id", [fn("count", col("id")), "n_contracts"]],
      group: ["customer_id"],
    });
    res.send({status: "OK", data: conts});
  })
);
router.get(
  "/search/groupby/vehicle",
  setModel,
  routeHandler(async (req, res) => {
    const conts = await Contract.findAll({
      attributes: ["vehicle_id", [fn("count", col("id")), "n_contracts"]],
      group: ["vehicle_id"],
    });
    res.send({status: "OK", data: conts});
  })
);
router.get(
  "/search/groupby/delay/customer",
  setModel,
  routeHandler(async (req, res) => {
    const conts = await connection.query(
      //run raw SQL queries > safe in this case because the query is not relying on user input (no risk of SQL injection)
      `SELECT dt.customer_id,dt.n_delays,dt.n_contracts, ROUND(dt.n_delays*1.00/dt.n_contracts,2) AS avg_nbr_delays 
        FROM (SELECT c.customer_id, COUNT(c.id) AS n_contracts, 
        SUM(CASE WHEN(c.loc_returning_datetime>c.loc_end_datetime) THEN 1 ELSE 0 END) AS n_delays
        FROM contracts c GROUP BY c.customer_id) dt`
    );
    res.send({status: "OK", data: conts});
  })
);
router.get(
  "/search/groupby/delay/vehicle",
  setModel,
  routeHandler(async (req, res) => {
    const conts = await Contract.findAll({
      attributes: [
        "vehicle_id",
        [
          fn(
            "avg",
            literal(
              "ISNULL(DATEDIFF(minute,loc_end_datetime,loc_returning_datetime),0)"
            )
          ),
          "average_delay_mns",
        ],
      ],
      group: ["vehicle_id"],
    });
    res.send({status: "OK", data: conts});
  })
);
export default router;
