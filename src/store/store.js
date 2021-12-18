const { createStore } = require("redux");
const mainReducer = require("./reducer");

const store = createStore(mainReducer);

module.exports = store;

// const keysAction = require("./actions/keysAction");
// store.dispatch(keysAction.setHashKey("saaaa"));
// store.dispatch(keysAction.setPrivetKey("xxxxxxxxxxx"));

// console.log(store.getState());
// console.log(store.getState().keys.hashKey);
