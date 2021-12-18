const request = require("request");

const { FLUREE_URL } = require("../../../config");
const fluree = require('../../services/fluree/fluree');
const openwhisk = require('../../services/openwhisk/openwhisk');

exports.main = function (app) {
  /*
  app.post("/api/fluree/create/device", async (req, res) => {
    var data = req.body;
    console.log(data);
    
    request.post(FLUREE_URL+'transact', {
        json: [
          {
            _id: "things",
            ...data
          },
        ]
      },
      function(err, response, body) {
        if (body.status === 200) {
          res.json({
            status: body.status,
            deviceId: body.tempids.things[0]
          });
        } else {
          res.json(body)
        }
    })//.pipe(res)
  });

  app.post("/api/fluree/create/user", async (req, res) => {
    var data = req.body;
    console.log(data);
    
    var _d = [{
      _id: "users",
      firstName: data.firstName,
      lastName: data.lastName,
      balance: data.userBalance
    }];

    request.post(FLUREE_URL+'transact', { json: _d},
      function(err, response, body) {
        if (body?.status === 200) {
          res.json({
            status: body.status,
            userId: body.tempids.users[0],
          });
        } else {
          res.json(body)
        }
      }
    );
  });

  app.post("/api/fluree/create/user-device", async (req, res) => {
    var data = req.body;
    console.log(data);

    var _d = [{
      _id: "users",
      firstName: data.firstName,
      lastName: data.lastName,
      balance: data.userBalance
    }];
    
    request.post(FLUREE_URL+'transact', { json: _d},
      function(err, response, body) {
        if (body?.status === 200) {
          _d =   [{
            _id: "things",
            ownerId: body.tempids.users[0],
            deviceId: data.deviceId,
            balance: data.deviceBalance
          }];

          request.post(FLUREE_URL+'transact', { json: _d},
            function(err, response, _body) {
              if (_body?.status === 200) {
                res.json({
                  status: body.status,
                  userId: body.tempids.users[0],
                  deviceId: _body.tempids.things[0]
                });
              } else {
                res.json(_body)
              }
          });
        } else {
          res.json(body)
        }
    })//.pipe(res)
  });
  */

  app.post("/api/fluree/create/user", async (req, res) => {
    var data = req.body;
    console.log(data);
    
    if (!data.userId) {
      res.json({
        status: false,
        message: "Check variable names"
      });
      return;
    }

    var _d = [{
      _id: "users",
      userId: data.userId,
      passes: data?.passes,
      balance: data?.balance
    }];

    request.post(FLUREE_URL+'transact', { json: _d},
      function(err, response, body) {
        if (err) {
          console.error(err);
          return;
        }

        if (body?.status === 200) {
          res.json({
            status: body.status,
            userId: body.tempids?.users[0],
          });
        } else {
          res.json({
            status: false,
            message: body
          });
        }
      }
    );
  });

  app.post("/api/fluree/change/balance", async (req, res) => {
    var data = req.body;
    console.log(data);
    
    if (!data.userId) {
      res.json({
        status: false,
        message: "Check variable names"
      });
      return;
    }

    var _d = [{
      _id: ["users/userId", data.userId],
      passes: data?.passes,
      balance: data?.balance
    }];

    request.post(FLUREE_URL+'transact', { json: _d},
      function(err, response, body) {
        if (err) {
          console.error(err);
          return;
        }

        if (body?.status === 200) {
          res.json({
            status: body.status,
            message: "Changed the balance " + data.balance,
          });
        } else {
          res.json({
            status: false,
            message: body
          });
        }
      }
    );
  });

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
    console.log('Get new request for connect');

    fluree.main();
    openwhisk.main()

    res.json({
      status: 'Ok',
    });
  });
}
