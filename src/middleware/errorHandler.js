import {ServerError} from "../models/validation/errors.js";

export function errorHandler(err, req, res, next) {
  res.send(new ServerError(err));
}
