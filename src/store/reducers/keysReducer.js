const keysAction = require("../actions/keysAction");

const initState = {
  publicKey: "",
  privetKey: "",
  hashKey: "",
};

module.exports = (state = initState, action) => {
  switch (action.type) {
    case keysAction.KEYS_SET_PUBLICKEY:
      return {
        ...state,
        publicKey: action.publicKey,
      };
    case keysAction.KEYS_SET_PRIVETKEY:
      return {
        ...state,
        privetKey: action.privetKey,
      };
    case keysAction.KEYS_SET_HASHKEY:
      return {
        ...state,
        hashKey: action.hashKey,
      };
    default:
      return state;
  }
};
