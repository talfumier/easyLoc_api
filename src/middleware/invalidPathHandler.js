export function invalidPathHandler(request, response, next) {
  response.status(400).send("invalid path");
}
