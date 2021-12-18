const openpgp = require("openpgp");

class cryptoPGP {
  static async generateKeys(...inputs) {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: "rsa", // Type of the key
      rsaBits: 2047, // RSA key size (defaults to 4096 bits)
      userIDs: [inputs], // you can pass multiple user IDs
      passphrase: "passapp", // protects the private key
    });

    return await { privateKey, publicKey };
  }
}

module.exports = cryptoPGP;
