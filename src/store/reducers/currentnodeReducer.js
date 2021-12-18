const currentNodeAction = require("../actions/currentNodeAction");

const initState = {
  peers: [],
};

module.exports = (state = initState, action) => {
  switch (action.type) {
    case keysAction.CURRENTNODE_INSERT_PEER:
      return {
        ...state,
        peers: action.publicKey,
      };
    case keysAction.CURRENTNODE_DELETE_PEER:
      const filteredPeer = state.peers.filter(
        (item) => item.coreKey !== action.node
      );

      state.nodes.nodes = sortBy_Time(filteredNode);
      state.nodes.count = state.nodes.nodes.length;
      return {
        ...state,
        peers: state.nodes,
      };
    default:
      return state;
  }
};
