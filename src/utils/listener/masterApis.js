const { HOSTING_PORT, LOCAL_HOSTIP } = require("../../../config");

exports.main = function (app) {
  app.get("/postman/connect", (req, res) => {
    var data = req.body;
    console.log('Get new request for connect', data);
    res.json({
      status: 'Ok',
    });
  });
}
