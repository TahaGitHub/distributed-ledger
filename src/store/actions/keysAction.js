const KEYS_SET_PUBLICKEY = "KEYS.SET_PUBLICKEY";
const KEYS_SET_PRIVETKEY = "KEYS.SET_PRIVETKEY";
const KEYS_SET_HASHKEY = "KEYS.SET_HASHKEY";

const setPublicKey = (publicKey) => {
  return {
    type: KEYS_SET_PUBLICKEY,
    publicKey,
  };
};

const setPrivetKey = (privetKey) => {
  return {
    type: KEYS_SET_PRIVETKEY,
    privetKey,
  };
};

const setHashKey = (hashKey) => {
  return {
    type: KEYS_SET_HASHKEY,
    hashKey,
  };
};

module.exports = {
  KEYS_SET_PUBLICKEY,
  KEYS_SET_PRIVETKEY,
  KEYS_SET_HASHKEY,

  setPublicKey,
  setPrivetKey,
  setHashKey,
};
