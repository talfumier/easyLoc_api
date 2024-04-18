import mongoose from "mongoose";

export const ContractSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    trim: true,
  },
  second_name: {
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
});

export const VehicleSchema = new mongoose.Schema({
  licence_plate: {
    type: String,
    required: true,
  },
  informations: {
    type: String,
  },
  km: {
    type: Number,
    required: true,
  },
});
