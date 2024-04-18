export function errorHandler(err, req, res, next) {
  //winston.error(err.message, err);
  res.status(500).send("Something failed in err_mw ! > " + err);
}
