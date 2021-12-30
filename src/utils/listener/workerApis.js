const fluree = require('../../services/fluree/fluree');
const openwhisk = require('../../services/openwhisk/openwhisk');

exports.main = function (app) {
  app.post("/api/pass/park", async (req, res) => {
    var data = req.body;
    console.log(data);
  
    openwhisk.OpenwhiskInvoke('parkingAction', data).then(_r => {
      res.json(_r);
    }).catch(error => {
      res.json(error);
    });
  });

  app.get("/api/connect", (req, res) => {
    console.log('\nGet Request.\nRunning fluree & openwhisk...');

    fluree.main();

    res.json({
      status: 'Ok',
    });
  });
}
