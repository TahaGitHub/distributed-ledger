const express = require("express");
const bodyParser = require("body-parser");

const { HOSTING_PORT, LOCAL_HOSTIP, NODE_TYPES } = require("../../../config");

exports.listener = function () {
  console.log(`\nNode's type: ${process.env.npm_config_type || NODE_TYPES.WORKER}`)
  
  const app = express();
  app.use
  app.use(bodyParser.json());

  let port;
  if (process.env.GENERATE_PEER_PORT === "true") {
    port = HOSTING_PORT + 10;
  }

  const PORT = port || HOSTING_PORT;
  app.listen(PORT, LOCAL_HOSTIP, () => {
    console.log(`listening:\n   HOST: ${LOCAL_HOSTIP}\n   PORT: ${PORT}`);

    if (
      process.env.npm_config_type === NODE_TYPES.MAIN_MASTER ||
      process.env.npm_config_type === NODE_TYPES.MASTER
    ) {
      require("./masterApis").main(app);
    } else {
      process.env.npm_config_type = NODE_TYPES.WORKER;
    }
        
    require("./workerApis").main(app);
    require("../hyperspace/hyperspace").hyperspace();
  });
}
