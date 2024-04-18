import express from "express";
import customers from "./customers.js";
import vehicles from "./vehicles.js";
import {errorHandler} from "../middleware/errorHandler.js";
import {invalidPathHandler} from "../middleware/invalidPathHandler.js";

export function routes(app) {
  app.use(express.json()); //express built-in middleware applies to any route

  app.use("/api/customers", customers);
  app.use("/api/vehicles", vehicles);

  app.use(errorHandler); //custom error handler middleware > function signature : function (err,req,res,next)
  app.use(invalidPathHandler); //invalid path handler middleware > eventually triggerered when none of the routes matches
}
