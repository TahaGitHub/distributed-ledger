const cryptoHash = require("./crypto-hash");
const cryptoPGP = require("./crypto-pgp");

const { FILES } = require("../../config");

const store = require("../store/store");
const keysAction = require("../store/actions/keysAction");

const FilesController = require("../helper/files-controller");

class Crypto {
  static async generateIdentity(...inputs) {
    if (!FilesController.isExistsFile(FILES.hash)) {
      console.log("Created New Hash Key");
      const hash = cryptoHash(inputs);
      store.dispatch(
        keysAction.setHashKey(FilesController.createSaveFile(FILES.hash, hash))
      );
    } else {
      console.log("Found Hash Key");
      store.dispatch(
        keysAction.setHashKey(FilesController.loadDataFile(FILES.hash))
      );
    }

    if (
      !FilesController.isExistsFile(FILES.pri) ||
      !FilesController.isExistsFile(FILES.pub)
    ) {
      console.log("Created New Pair Keys");
      const pair = await cryptoPGP.generateKeys(inputs);
      store.dispatch(
        keysAction.setPrivetKey(
          FilesController.createSaveFile(FILES.pri, pair.privateKey)
        )
      );
      store.dispatch(
        keysAction.setPublicKey(
          FilesController.createSaveFile(FILES.pub, pair.publicKey)
        )
      );
    } else {
      console.log("Found Pair Keys");
      store.dispatch(
        keysAction.setPrivetKey(FilesController.loadDataFile(FILES.pri))
      );
      store.dispatch(
        keysAction.setPublicKey(FilesController.loadDataFile(FILES.pub))
      );
    }

    return true;
  }
}

// const folderName = '/crypto-files';
// const name = 'Pass App';
// const email = 'passapp@gmail.com';
// Crypto.generateIdentity({ folderName, name, email });

module.exports = {
  Crypto,
  cryptoHash,
  cryptoPGP,
};
