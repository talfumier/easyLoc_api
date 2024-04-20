import mongoose from "mongoose";
import Joi from "joi";
import {joiSubSchema} from "./validation/joiUtilityFunctions.js";

const CustomerSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    permit_number: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {timestamps: true}
);
export const Customer = mongoose.model("Customer", CustomerSchema);
export function validateCustomer(custr, cs = "post") {
  let schema = Joi.object({
    first_name: Joi.string(),
    last_name: Joi.string(),
    address: Joi.string(),
    permit_number: Joi.string(),
  });
  let required = [];
  switch (cs) {
    case "post":
      required = ["first_name", "last_name", "address", "permit_number"];
      schema = schema.fork(required, (field) => field.required());
      return schema.validate(custr);
    case "get":
    case "patch":
      const subSchema = joiSubSchema(schema, Object.keys(custr));
      return subSchema
        ? subSchema.validate(custr)
        : {
            error: {
              details: [{message: "Request body contains invalid fields."}],
            },
          };
  }
}

const VehicleSchema = new mongoose.Schema(
  {
    licence_plate: {
      type: String,
      required: true,
    },
    informations: {
      type: String,
      default: "",
    },
    km: {
      type: Number,
      required: true,
    },
  },
  {timestamps: true}
);
export const Vehicle = mongoose.model("Vehicle", VehicleSchema);

export function validateVehicle(vcl, cs = "post") {
  let schema = Joi.object({
    licence_plate: Joi.string(),
    informations: Joi.string().allow(""),
    km: Joi.number(),
  });
  let required = [];
  switch (cs) {
    case "post":
      required = ["licence_plate", "km"];
      schema = schema.fork(required, (field) => field.required());
      return schema.validate(vcl);
    case "get":
    case "patch":
      const subSchema = joiSubSchema(schema, Object.keys(vcl));
      return subSchema
        ? subSchema.validate(vcl)
        : {
            error: {
              details: [{message: "Request body contains invalid fields."}],
            },
          };
  }
}
