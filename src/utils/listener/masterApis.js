const request = require("request");

exports.main = function (app) {
  app.get("/api/fluree/add-server", (req, res) => {
    var data = req.body;
    console.log('Connect request to new server', data);

    request.post(`http://${FLUREE_HISTIP}:${FLUREEHOSTING_PORT}/fdb/add-server`, { json: data},
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
