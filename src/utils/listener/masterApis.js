const request = require("request");
const fs = require("fs");

const { FLUREEHOSTING_PORT, LOCAL_HOSTIP, FLUREE_DB, BASEDIR, FLUREE_URL } = require("../../../config");

const { logWithColor } = require("../../helper/logs");

exports.main = function (app) {
  app.post("/api/fluree/add-server", (req, res) => {
    var data = req.body;
    
    logWithColor('magenta', `\nConnect request to new server ${data.server}`);
    request.post(`http://${LOCAL_HOSTIP}:${FLUREEHOSTING_PORT}/fdb/add-server`,
      { 
        json: data
      },
      function(err, response, body) {
        if (err) {
          console.error(err);
          return;
        }

        if (body?.status === 200) {
          res.json({
            status: 'Ok',
            message: body
          });
        } else {
          res.json({
            status: false,
            message: body
          });
        }
      });
  });

  app.post("/api/fluree/remove-server", (req, res) => {
    var data = req.body;
    logWithColor('magenta', `\nConnect request to new server ${data.server}`);

    request.post(`http://${LOCAL_HOSTIP}:${FLUREEHOSTING_PORT}/fdb/remove-server`,
      {
        json: data
      },
      function(err, response, body) {
        if (err) {
          console.error(err);
          return;
        }

        if (body?.status === 200) {
          res.json({
            status: 'Ok',
            message: body
          });
        } else {
          res.json({
            status: false,
            message: body
          });
        }
      });
  });

  app.post("/api/fluree/create/user", async (req, res) => {
    var data = req.body;
    console.log(data);

    var result = data.map(function(el) {
      var o = Object.assign({}, el);
      o._id = "users_balance";
      return o;
    });

    request.post(FLUREE_URL+'transact', { json: result },
      function(err, response, body) {
        if (err) {
          console.error(err);
          return;
        }

        if (body?.status === 200) {
          res.json({
            status: body.status,
            userId: body.tempids?.users,
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

  app.post("/api/fluree/transact/balance", async (req, res) => {
    var data = req.body;
    console.log(data);
    
    if (!data.user_id) {
      res.json({
        status: false,
        message: "Check variable names"
      });
      return;
    }

    var _d = [{
      _id: ["users_balance/user_id", data.user_id],
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
}

/*
** Just for Main Master node 
** Create schema
** Get data from server
** store data in fluree
*/
exports.addLedger =  function () {
  request.get(`http://${LOCAL_HOSTIP}:${FLUREEHOSTING_PORT}/fdb/dbs`,
    function(err, response, body) {
      if (err) {
        console.error(err);
        return;
      }
      
      const _body = JSON.parse(body);
      const index = _body.findIndex(item => `${item[0]}/${item[1]}` === FLUREE_DB.ALL);

      if (index === -1) {
        logWithColor('magenta', `\nTrying to create ledger ${FLUREE_DB.ALL}`);
        var data = {
          "db/id": FLUREE_DB.ALL
        };
        request.post(`http://${LOCAL_HOSTIP}:${FLUREEHOSTING_PORT}/fdb/new-db`,
        {
          json: data
        },
        function(err, response, body) {
          if (err) {
            console.error(err);
            return;
          }
          logWithColor('green', `\nLedger ${FLUREE_DB.ALL} created successfuly\n`);

          let data = fs.readFileSync(BASEDIR + "/schema/FlureeSchema.json", "utf8");

          logWithColor('magenta', `\nTrying to create schema: ${FLUREE_DB.ALL}`);
          setTimeout(() => {
            request.post(FLUREE_URL+'transact',
              { 
                json: JSON.parse(data)
              },
              function(err, response, body) {
                if (err) {
                  console.error(err);
                  return;
                }
  
                if (body?.status === 200) {
                  logWithColor('green', `\nSchema created successfully\nGetting data...`);
                  request.get('https://estaging.passapp.io/api-nodes/balances/get-all',
                    function(err, response, body) {
                      if (err) {
                        console.log(err)
                      }
                      
                      logWithColor('magenta', "\nTransact data to fluree...\n");
                      var result = JSON.parse(body).map(function(el) {
                        var o = Object.assign({}, el);
                        o._id = "users_balance";
                        return o;
                      });
                      request.post(FLUREE_URL+'transact',
                      { 
                        json: result
                      },
                      function(err, response, body) {
                        if (body?.status === 200) {
                          logWithColor('green', `\nTransact data into Fluree\n`);
                        } else {
                          logWithColor('green', `\nError transact data into Fluree\n`);
                        }
                      });
                    });
                } else {
                  logWithColor('green', `\nErrot with Schema created`);
                }
              }
            );
          }, 1000);
        });
      } else {
        logWithColor('green', `\nLedger ${FLUREE_DB.ALL} found\n`);
      }
  });
}
