const { CURRENT_NODEDATA_CRYPTO } = require("./config");

const { Crypto } = require("./src/crypto");
const Node = require("./src/units/node");

/*
 ** Create or load from files
 ** 'Hash, Privet and Public key'
 ** load into redux store
 */
function main () {
  Crypto.generateIdentity(CURRENT_NODEDATA_CRYPTO).then(() => {
    // console.log('Generated Identity Keys');
    Node.genesisFile().then(() => {
      // console.log('Created Nodes File');
      require("./src/utils/listener/listener").listener();
    });
  });
}

main();