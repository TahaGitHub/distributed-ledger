const request = require("request");
const { FLUREEHOSTING_PORT, LOCAL_HOSTIP } = require("../../../config");

exports.main = function (app) {
  app.get("/api/fluree/add-server", (req, res) => {
    var data = req.body;
    console.log('Connect request to new server', data);

    request.post(`http://${LOCAL_HOSTIP}:${FLUREEHOSTING_PORT}/fdb/add-server`, { json: data},
    function(err, response, body) {
      if (err) {
        console.error(err);
        return;
      }

      if (body?.status === 200) {
        res.json({
          status: 'Ok',
        });
      } else {
        res.json({
          status: false,
          message: body
        });
      }
    });
  });
}
