const crypto = require('crypto');

const cryptoHash = (...inputs) => {
  // Create 256 hash type
  const hash = crypto.createHash('sha256');

  // Set the string argument that will generate with hash value and using map to unique hash
  hash.update(inputs.map((input) => JSON.stringify(input)).sort().join(' '));

  // Pass the hash code on a string hex
  return hash.digest('hex');
};

module.exports = cryptoHash;