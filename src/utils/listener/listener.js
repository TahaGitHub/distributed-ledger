const express = require("express");
const ip = require('ip');
const bodyParser = require("body-parser");

const { HOSTING_PORT, LOCAL_HOSTIP, NODE_TYPES, NODE_TYPE } = require("../../../config");

exports.listener = async function () {
  const listing_port = await ip.address();

  console.log(`\nNode's type: ${NODE_TYPE}`)
  
  const app = express();
  app.use
  app.use(bodyParser.json());

  let port;
  if (process.env.GENERATE_PEER_PORT === "true") {
    port = HOSTING_PORT + 10;
  }

  const PORT = port || HOSTING_PORT;
  app.listen(PORT, listing_port, () => {
    console.log(`listening:\n   HOST: ${LOCAL_HOSTIP}\n   DOCKER:${listing_port}\n   PORT: ${PORT}`);
    
    if (
      NODE_TYPE === NODE_TYPES.MAIN_MASTER ||
      NODE_TYPE === NODE_TYPES.MASTER
    ) {
      require("./masterApis").main(app);
    }
        
    require("./workerApis").main(app);
    require("../hyperspace/hyperspace").hyperspace();
  });
}
