import {DataTypes} from "sequelize";
import Joi from "joi";
import {addHours, differenceInMinutes} from "date-fns";
import {
  JoiObjectIdSchema,
  joiSubSchema,
} from "./validation/joiUtilityFunctions.js";

let models = {Contract: null, Billing: null, connection: null};
export function getModels() {
  return models;
}
export function defineSqlServerModels(sqlServerConnection) {
  const Contract = sqlServerConnection.define("contracts", {
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    vehicle_id: {type: DataTypes.STRING, allowNull: false},
    customer_id: {type: DataTypes.STRING, allowNull: false},
    sign_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    loc_begin_datetime: {type: DataTypes.DATE, allowNull: false},
    loc_end_datetime: {type: DataTypes.DATE, allowNull: false},
    loc_returning_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    price: {type: DataTypes.DECIMAL, allowNull: true},
    status: {
      type: DataTypes.VIRTUAL,
      get() {
        const status = [];
        if (!this.getDataValue("loc_returning_datetime")) {
          status.push("ongoing");
          if (new Date() > addHours(this.getDataValue("loc_end_datetime"), 1))
            status.push("late");
        } else {
          status.push("completed");
          if (
            this.getDataValue("loc_returning_datetime") >
            addHours(this.getDataValue("loc_end_datetime"), 1)
          )
            status.push("late");
        }
        return status;
      },
    },
    car_return_delay_hours: {
      //number of hours passed the deadline (loc_end_datetime)
      type: DataTypes.VIRTUAL,
      get() {
        const date_limit = this.getDataValue("loc_end_datetime");
        const date2 = this.getDataValue("loc_returning_datetime")
          ? this.getDataValue("loc_returning_datetime")
          : new Date();
        return (differenceInMinutes(date2, date_limit) / 60).toFixed(2);
      },
    },
  });
  const Billing = sqlServerConnection.define("billings", {
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    contract_id: {type: DataTypes.INTEGER, allowNull: false},
    amount: {type: DataTypes.DECIMAL, allowNull: true},
  });
  return (models = {Contract, Billing, connection: sqlServerConnection});
}
export function validateContract(cont, cs = "post") {
  let schema = Joi.object({
    vehicle_id: JoiObjectIdSchema,
    customer_id: JoiObjectIdSchema,
    sign_datetime: Joi.date().allow(null),
    loc_begin_datetime: Joi.date(),
    loc_end_datetime: Joi.date(),
    returning_datetime: Joi.date().allow(null),
    price: Joi.number(),
  });
  let required = [];
  switch (cs) {
    case "post":
      required = [
        "vehicle_id",
        "customer_id",
        "loc_begin_datetime",
        "loc_end_datetime",
        "price",
      ];
      schema = schema.fork(required, (field) => field.required());
      return schema.validate(cont);
    case "get":
    case "patch":
      const subSchema = joiSubSchema(schema, Object.keys(cont));
      return subSchema
        ? subSchema.validate(cont)
        : {
            error: {
              details: [{message: "Request body contains invalid fields."}],
            },
          };
  }
}
export function validateBilling(bill, cs = "post") {
  let schema = Joi.object({
    contract_id: Joi.number(),
    amount: Joi.number(),
  });
  let required = [];
  switch (cs) {
    case "post":
      required = ["contract_id", "amount"];
      schema = schema.fork(required, (field) => field.required());
      return schema.validate(cont);
    case "get":
    case "patch":
      const subSchema = joiSubSchema(schema, Object.keys(bill));
      return subSchema
        ? subSchema.validate(bill)
        : {
            error: {
              details: [{message: "Request body contains invalid fields."}],
            },
          };
  }
}
