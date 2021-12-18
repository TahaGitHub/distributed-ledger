const { combineReducers } = require("redux");

const keysReducer = require("./reducers/keysReducer");
const nodesReducer = require("./reducers/nodesReducer");
const usersReducer = require("./reducers/usersReducer");

module.exports = combineReducers({
  keys: keysReducer,
  nodes: nodesReducer,
  // users: usersReducer,
});
