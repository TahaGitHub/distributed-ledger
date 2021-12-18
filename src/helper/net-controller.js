const getPort = require("get-port");

exports.SetPort = function (from, to) {
  return getPort({ port: getPort.makeRange(from, to) })
}